-- =====================================================================
-- SAQUA ON — Comunidade (publicações, comentários, denúncias),
-- ferramentas do administrador e envio de fotos (Supabase Storage).
-- Rode DEPOIS de 20261104000000_schema_inicial.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABELAS
-- ---------------------------------------------------------------------
create table public.publicacoes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references public.usuarios (id) on delete cascade,
  praia_id      uuid references public.praias (id) on delete set null,
  conteudo      text not null check (char_length(btrim(conteudo)) between 3 and 1000),
  foto_url      text check (foto_url is null or foto_url ~* '^https?://'),
  autor_nome    text not null default '',          -- preenchido por trigger (ex.: "Maria S.")
  status        text not null default 'publicada' check (status in ('publicada', 'oculta')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index publicacoes_criado_idx on public.publicacoes (criado_em desc);
create index publicacoes_usuario_idx on public.publicacoes (usuario_id);

create table public.comentarios (
  id            uuid primary key default gen_random_uuid(),
  publicacao_id uuid not null references public.publicacoes (id) on delete cascade,
  usuario_id    uuid not null references public.usuarios (id) on delete cascade,
  conteudo      text not null check (char_length(btrim(conteudo)) between 1 and 500),
  autor_nome    text not null default '',
  status        text not null default 'publicada' check (status in ('publicada', 'oculta')),
  criado_em     timestamptz not null default now()
);
create index comentarios_publicacao_idx on public.comentarios (publicacao_id, criado_em);

create table public.denuncias (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references public.usuarios (id) on delete cascade,
  alvo_tipo    text not null check (alvo_tipo in ('publicacao', 'comentario', 'estabelecimento')),
  alvo_id      uuid not null,
  motivo       text not null check (motivo in ('spam', 'ofensivo', 'falso', 'outro')),
  detalhe      text check (detalhe is null or char_length(detalhe) <= 500),
  status       text not null default 'aberta' check (status in ('aberta', 'resolvida', 'descartada')),
  criado_em    timestamptz not null default now(),
  resolvido_em timestamptz,
  constraint denuncias_uma_por_alvo unique (usuario_id, alvo_tipo, alvo_id)
);
create index denuncias_status_idx on public.denuncias (status, criado_em desc);

-- ---------------------------------------------------------------------
-- 2) TRIGGERS (nome do autor + limite contra spam)
-- ---------------------------------------------------------------------
create or replace function private.preencher_autor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome   text;
  v_ultimo text;
begin
  select btrim(nome) into v_nome from public.usuarios where id = new.usuario_id;
  v_nome := coalesce(v_nome, '');
  v_ultimo := case when position(' ' in v_nome) > 0 then regexp_replace(v_nome, '^.*\s', '') end;
  new.autor_nome := split_part(v_nome, ' ', 1) || coalesce(' ' || upper(left(v_ultimo, 1)) || '.', '');
  new.conteudo := btrim(new.conteudo);
  return new;
end;
$$;

create or replace function private.limitar_publicacoes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() and (
    select count(*) from public.publicacoes
    where usuario_id = new.usuario_id and criado_em > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Você publicou muito em pouco tempo. Aguarde um pouco e tente de novo.';
  end if;
  return new;
end;
$$;

create or replace function private.limitar_comentarios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() and (
    select count(*) from public.comentarios
    where usuario_id = new.usuario_id and criado_em > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'Você comentou muito em pouco tempo. Aguarde um pouco e tente de novo.';
  end if;
  return new;
end;
$$;

revoke execute on function private.preencher_autor(), private.limitar_publicacoes(), private.limitar_comentarios() from public;

create trigger publicacoes_autor  before insert on public.publicacoes
  for each row execute function private.preencher_autor();
create trigger publicacoes_limite before insert on public.publicacoes
  for each row execute function private.limitar_publicacoes();
create trigger comentarios_autor  before insert on public.comentarios
  for each row execute function private.preencher_autor();
create trigger comentarios_limite before insert on public.comentarios
  for each row execute function private.limitar_comentarios();
create trigger publicacoes_updated_at before update on public.publicacoes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------
alter table public.publicacoes enable row level security;
alter table public.comentarios enable row level security;
alter table public.denuncias   enable row level security;

create policy publicacoes_select on public.publicacoes for select to anon, authenticated
  using (status = 'publicada' or usuario_id = (select auth.uid()) or (select private.is_admin()));
create policy publicacoes_insert on public.publicacoes for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy publicacoes_update on public.publicacoes for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));
create policy publicacoes_delete on public.publicacoes for delete to authenticated
  using (usuario_id = (select auth.uid()) or (select private.is_admin()));

create policy comentarios_select on public.comentarios for select to anon, authenticated
  using (
    (status = 'publicada' or usuario_id = (select auth.uid()) or (select private.is_admin()))
    and exists (select 1 from public.publicacoes p where p.id = comentarios.publicacao_id)
  );
create policy comentarios_insert on public.comentarios for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and exists (select 1 from public.publicacoes p where p.id = publicacao_id and p.status = 'publicada')
  );
create policy comentarios_delete on public.comentarios for delete to authenticated
  using (usuario_id = (select auth.uid()) or (select private.is_admin()));

create policy denuncias_select on public.denuncias for select to authenticated
  using (usuario_id = (select auth.uid()) or (select private.is_admin()));
create policy denuncias_insert on public.denuncias for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 4) PERMISSÕES (GRANT)
-- ---------------------------------------------------------------------
revoke all on public.publicacoes, public.comentarios, public.denuncias from anon, authenticated;

-- visitantes não enxergam o usuario_id de quem publicou
grant select (id, praia_id, conteudo, foto_url, autor_nome, status, criado_em, atualizado_em)
  on public.publicacoes to anon;
grant select on public.publicacoes to authenticated;
grant insert (usuario_id, praia_id, conteudo, foto_url) on public.publicacoes to authenticated;
grant update (praia_id, conteudo, foto_url) on public.publicacoes to authenticated;
grant delete on public.publicacoes to authenticated;

grant select (id, publicacao_id, conteudo, autor_nome, status, criado_em) on public.comentarios to anon;
grant select on public.comentarios to authenticated;
grant insert (publicacao_id, usuario_id, conteudo) on public.comentarios to authenticated;
grant delete on public.comentarios to authenticated;

grant select on public.denuncias to authenticated;
grant insert (usuario_id, alvo_tipo, alvo_id, motivo, detalhe) on public.denuncias to authenticated;

-- ---------------------------------------------------------------------
-- 5) FUNÇÕES DO ADMINISTRADOR (UC18–UC20)
--    Todas checam is_admin() por dentro; quem não é admin recebe 42501.
-- ---------------------------------------------------------------------
create or replace function public.admin_denuncias(p_status text default 'aberta')
returns table (
  id uuid, alvo_tipo text, alvo_id uuid, motivo text, detalhe text, status text,
  criado_em timestamptz, denunciante text, resumo text, alvo_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Apenas administradores.' using errcode = '42501';
  end if;
  return query
  select d.id, d.alvo_tipo, d.alvo_id, d.motivo, d.detalhe, d.status, d.criado_em,
         u.nome,
         case d.alvo_tipo
           when 'publicacao'      then (select left(p.conteudo, 200) from public.publicacoes p where p.id = d.alvo_id)
           when 'comentario'      then (select left(c.conteudo, 200) from public.comentarios c where c.id = d.alvo_id)
           else                        (select c.nome_negocio from public.comerciantes c where c.id = d.alvo_id)
         end,
         case d.alvo_tipo
           when 'publicacao'      then (select p.status from public.publicacoes p where p.id = d.alvo_id)
           when 'comentario'      then (select c.status from public.comentarios c where c.id = d.alvo_id)
           else                        (select c.status from public.comerciantes c where c.id = d.alvo_id)
         end
  from public.denuncias d
  join public.usuarios u on u.id = d.usuario_id
  where p_status = 'todas' or d.status = p_status
  order by d.criado_em desc
  limit 200;
end;
$$;

create or replace function public.admin_resolver_denuncia(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Apenas administradores.' using errcode = '42501';
  end if;
  if p_status not in ('resolvida', 'descartada', 'aberta') then
    raise exception 'Status inválido.';
  end if;
  update public.denuncias
     set status = p_status,
         resolvido_em = case when p_status = 'aberta' then null else now() end
   where id = p_id;
end;
$$;

-- Oculta (ou reexibe) uma publicação ou um comentário
create or replace function public.admin_moderar(p_tipo text, p_id uuid, p_ocultar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := case when p_ocultar then 'oculta' else 'publicada' end;
begin
  if not private.is_admin() then
    raise exception 'Apenas administradores.' using errcode = '42501';
  end if;
  if p_tipo = 'publicacao' then
    update public.publicacoes set status = v_status where id = p_id;
  elsif p_tipo = 'comentario' then
    update public.comentarios set status = v_status where id = p_id;
  else
    raise exception 'Tipo inválido.';
  end if;
end;
$$;

create or replace function public.admin_definir_tipo(p_usuario uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Apenas administradores.' using errcode = '42501';
  end if;
  if p_tipo not in ('turista', 'morador', 'comerciante', 'administrador') then
    raise exception 'Tipo inválido.';
  end if;
  if p_usuario = (select auth.uid()) and p_tipo <> 'administrador' then
    raise exception 'Você não pode remover o seu próprio acesso de administrador.';
  end if;
  update public.usuarios set tipo = p_tipo where id = p_usuario;
end;
$$;

revoke execute on function public.admin_denuncias(text), public.admin_resolver_denuncia(uuid, text),
  public.admin_moderar(text, uuid, boolean), public.admin_definir_tipo(uuid, text) from public, anon;
grant execute on function public.admin_denuncias(text), public.admin_resolver_denuncia(uuid, text),
  public.admin_moderar(text, uuid, boolean), public.admin_definir_tipo(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) STORAGE — bucket "fotos" (UC14–UC17 e publicações)
--    Caminho: <id-do-usuário>/<pasta>/<arquivo>. Cada pessoa só mexe na própria pasta.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
create policy fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
