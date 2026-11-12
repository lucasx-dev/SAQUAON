import React, { useEffect, useId, useState } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle, Info, Loader2, ShieldCheck, MailCheck } from 'lucide-react';
import { SaquaOnLogo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { checkPasswordRules, validateEmail, validateNewPassword, validatePersonName } from '../lib/validation';
import type { SignupType } from '../types';
import { Captcha, CAPTCHA_ENABLED } from './Captcha';

type ConfirmKind = 'signup' | 'reset' | 'newpass';

const TIPOS: { id: SignupType; titulo: string; descricao: string }[] = [
  { id: 'turista', titulo: 'Turista', descricao: 'Vim aproveitar as praias' },
  { id: 'morador', titulo: 'Morador', descricao: 'Moro em Saquarema' },
  { id: 'comerciante', titulo: 'Comerciante', descricao: 'Tenho um negócio local' },
];

const inputClass = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
      : 'border-slate-300 focus:ring-[#004F8A]/30 focus:border-[#004F8A]'
  }`;

export const AuthModal: React.FC = () => {
  const uid = useId();
  const { modal, closeAuthModal, setAuthView, signIn, signUp, sendPasswordReset, updatePassword } = useAuth();
  const { open, view, tipo: initialTipo, notice } = modal;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [tipo, setTipo] = useState<SignupType>(initialTipo);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>('signup');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  /** Sem token a verificação ainda não foi concluída; com o token usado, pede outra. */
  const needCaptcha = (): boolean => {
    if (CAPTCHA_ENABLED && !captchaToken) {
      setFormError('Conclua a verificação de segurança antes de continuar.');
      return true;
    }
    return false;
  };
  const usedCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  };

  // Ao abrir, começa com o formulário limpo
  useEffect(() => {
    if (!open) return;
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmar('');
    setTipo(initialTipo);
    setErrors({});
    setFormError(null);
    setShowPassword(false);
    setSubmitting(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao trocar de tela (entrar / criar conta / esqueci...), limpa erros e senhas
  useEffect(() => {
    setErrors({});
    setFormError(null);
    setSenha('');
    setConfirmar('');
    setShowPassword(false);
  }, [view]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeAuthModal]);

  if (!open) return null;

  const fail = (next: Record<string, string>) => {
    setErrors(next);
    setFormError(null);
    return Object.keys(next).length > 0;
  };

  // ------------------------------------------------------------ envio
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRes = validateEmail(email);
    const next: Record<string, string> = {};
    if (emailRes.error) next.email = emailRes.error;
    if (!senha) next.senha = 'Informe sua senha.';
    if (fail(next)) return;
    if (needCaptcha()) return;

    setSubmitting(true);
    const res = await signIn(emailRes.value, senha, captchaToken ?? undefined);
    setSubmitting(false);
    if (res.error) {
      setFormError(res.error);
      usedCaptcha();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeRes = validatePersonName(nome);
    const emailRes = validateEmail(email);
    const next: Record<string, string> = {};
    if (nomeRes.error) next.nome = nomeRes.error;
    if (emailRes.error) next.email = emailRes.error;
    const senhaErro = validateNewPassword(senha);
    if (senhaErro) next.senha = senhaErro;
    if (!next.senha && confirmar !== senha) next.confirmar = 'As senhas não são iguais.';
    if (!TIPOS.some((t) => t.id === tipo)) next.tipo = 'Escolha como você vai usar o SAQUA ON.';
    if (fail(next)) return;
    if (needCaptcha()) return;

    setSubmitting(true);
    const res = await signUp({ nome: nomeRes.value, email: emailRes.value, senha, tipo, captchaToken: captchaToken ?? undefined });
    setSubmitting(false);
    if (res.error) {
      setFormError(res.error);
      usedCaptcha();
    } else if (res.needsConfirmation) {
      setConfirmKind('signup');
      setAuthView('confirmacao');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRes = validateEmail(email);
    if (fail(emailRes.error ? { email: emailRes.error } : {})) return;
    if (needCaptcha()) return;

    setSubmitting(true);
    const res = await sendPasswordReset(emailRes.value, captchaToken ?? undefined);
    setSubmitting(false);
    if (res.error) {
      setFormError(res.error);
      usedCaptcha();
    } else {
      setConfirmKind('reset');
      setAuthView('confirmacao');
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const senhaErro = validateNewPassword(senha);
    if (senhaErro) next.senha = senhaErro;
    if (!next.senha && confirmar !== senha) next.confirmar = 'As senhas não são iguais.';
    if (fail(next)) return;

    setSubmitting(true);
    const res = await updatePassword(senha);
    setSubmitting(false);
    if (res.error) {
      setFormError(res.error);
    } else {
      setConfirmKind('newpass');
      setAuthView('confirmacao');
    }
  };

  // ---------------------------------------------------- peças da tela
  const titles: Record<typeof view, { eyebrow: string; title: string; subtitle: string }> = {
    login: {
      eyebrow: 'Acesso à Plataforma',
      title: 'Entrar no SAQUA ON',
      subtitle: 'Acesse sua conta para avaliar locais e cadastrar seu negócio.',
    },
    cadastro: {
      eyebrow: 'Acesso Gratuito à Plataforma',
      title: 'Criar minha conta',
      subtitle: 'Leva menos de 1 minuto. Sem cartão de crédito.',
    },
    esqueci: {
      eyebrow: 'Recuperar acesso',
      title: 'Esqueci minha senha',
      subtitle: 'Informe seu e-mail e enviaremos um link para criar uma nova senha.',
    },
    recuperar: {
      eyebrow: 'Recuperar acesso',
      title: 'Criar nova senha',
      subtitle: 'Escolha uma senha nova para a sua conta.',
    },
    confirmacao: {
      eyebrow: 'SAQUA ON',
      title: confirmKind === 'newpass' ? 'Senha atualizada' : 'Verifique seu e-mail',
      subtitle: '',
    },
  };
  const head = titles[view];

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${uid}-${key}-erro`} className="mt-1 text-xs text-red-600 flex items-start gap-1" role="alert">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>{errors[key]}</span>
      </p>
    ) : null;

  const describedBy = (key: string) => (errors[key] ? `${uid}-${key}-erro` : undefined);

  const passwordInput = (
    key: 'senha' | 'confirmar',
    label: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: 'current-password' | 'new-password',
    autoFocus = false
  ) => (
    <div>
      <label htmlFor={`${uid}-${key}`} className="block text-xs font-bold text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={`${uid}-${key}`}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={72}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={describedBy(key)}
          className={`${inputClass(Boolean(errors[key]))} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {fieldError(key)}
    </div>
  );

  const emailInput = (autoFocus = false) => (
    <div>
      <label htmlFor={`${uid}-email`} className="block text-xs font-bold text-slate-700 mb-1">
        E-mail
      </label>
      <input
        id={`${uid}-email`}
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        autoFocus={autoFocus}
        maxLength={254}
        placeholder="seuemail@exemplo.com"
        aria-invalid={Boolean(errors.email)}
        aria-describedby={describedBy('email')}
        className={inputClass(Boolean(errors.email))}
      />
      {fieldError('email')}
    </div>
  );

  const passwordChecklist = (
    <ul className="mt-2 space-y-1" aria-label="Requisitos da senha">
      {checkPasswordRules(senha).map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-[11px] font-medium ${rule.ok ? 'text-emerald-700' : 'text-slate-500'}`}
        >
          <Check className={`w-3 h-3 ${rule.ok ? 'opacity-100' : 'opacity-30'}`} />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );

  const submitButton = (label: string) => (
    <button
      type="submit"
      disabled={submitting}
      className="w-full bg-[#004F8A] hover:bg-[#003866] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
      <span>{submitting ? 'Aguarde...' : label}</span>
    </button>
  );

  const formErrorBox = formError ? (
    <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl p-3">
      <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
      <span>{formError}</span>
    </div>
  ) : null;

  const switchLink = (text: string, linkLabel: string, target: typeof view) => (
    <p className="text-xs text-slate-600 text-center">
      {text}{' '}
      <button
        type="button"
        onClick={() => setAuthView(target)}
        className="font-bold text-[#004F8A] hover:underline cursor-pointer"
      >
        {linkLabel}
      </button>
    </p>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-titulo`}
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="bg-[#004F8A] text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <SaquaOnLogo variant="symbol" size="sm" inverted />
            <span className="text-[11px] font-bold tracking-widest text-[#4FA8D8] uppercase">{head.eyebrow}</span>
          </div>
          <h3 id={`${uid}-titulo`} className="text-xl sm:text-2xl font-black font-display leading-snug">
            {head.title}
          </h3>
          {head.subtitle && <p className="text-xs text-white/80 mt-1">{head.subtitle}</p>}
        </div>

        {/* Corpo */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {notice && (
            <div role="status" className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium rounded-xl p-3 mb-4">
              <Info className="w-4 h-4 shrink-0 mt-px" />
              <span>{notice}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {emailInput(true)}
              {passwordInput('senha', 'Senha', senha, setSenha, 'current-password')}
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => setAuthView('esqueci')}
                  className="text-xs font-bold text-[#004F8A] hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Captcha key="login" onToken={setCaptchaToken} resetKey={captchaReset} />
              {formErrorBox}
              {submitButton('Entrar')}
              {switchLink('Ainda não tem conta?', 'Criar conta grátis', 'cadastro')}
            </form>
          )}

          {view === 'cadastro' && (
            <form onSubmit={handleSignup} noValidate className="space-y-4">
              <div>
                <label htmlFor={`${uid}-nome`} className="block text-xs font-bold text-slate-700 mb-1">
                  Seu nome
                </label>
                <input
                  id={`${uid}-nome`}
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  maxLength={80}
                  placeholder="Como quer ser chamado?"
                  aria-invalid={Boolean(errors.nome)}
                  aria-describedby={describedBy('nome')}
                  className={inputClass(Boolean(errors.nome))}
                />
                {fieldError('nome')}
              </div>

              {emailInput()}

              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1" id={`${uid}-tipo-label`}>
                  Como você vai usar o SAQUA ON?
                </span>
                <div role="radiogroup" aria-labelledby={`${uid}-tipo-label`} className="grid grid-cols-3 gap-2">
                  {TIPOS.map((t) => {
                    const selected = tipo === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTipo(t.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#004F8A] text-white border-[#004F8A] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-xs font-bold">{t.titulo}</span>
                        <span className={`block text-[10px] leading-tight mt-0.5 ${selected ? 'text-[#4FA8D8]' : 'text-slate-500'}`}>
                          {t.descricao}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fieldError('tipo')}
              </div>

              <div>
                {passwordInput('senha', 'Crie uma senha', senha, setSenha, 'new-password')}
                {passwordChecklist}
              </div>
              {passwordInput('confirmar', 'Repita a senha', confirmar, setConfirmar, 'new-password')}

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Usamos seus dados só para criar e proteger sua conta, de acordo com a LGPD.</span>
              </p>

              <Captcha key="cadastro" onToken={setCaptchaToken} resetKey={captchaReset} />
              {formErrorBox}
              {submitButton('Criar minha conta')}
              {switchLink('Já tem conta?', 'Entrar', 'login')}
            </form>
          )}

          {view === 'esqueci' && (
            <form onSubmit={handleForgot} noValidate className="space-y-4">
              {emailInput(true)}
              <Captcha key="esqueci" onToken={setCaptchaToken} resetKey={captchaReset} />
              {formErrorBox}
              {submitButton('Enviar link de recuperação')}
              {switchLink('Lembrou a senha?', 'Voltar para entrar', 'login')}
            </form>
          )}

          {view === 'recuperar' && (
            <form onSubmit={handleRecover} noValidate className="space-y-4">
              <div>
                {passwordInput('senha', 'Nova senha', senha, setSenha, 'new-password', true)}
                {passwordChecklist}
              </div>
              {passwordInput('confirmar', 'Repita a nova senha', confirmar, setConfirmar, 'new-password')}
              {formErrorBox}
              {submitButton('Salvar nova senha')}
            </form>
          )}

          {view === 'confirmacao' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {confirmKind === 'newpass' ? <Check className="w-8 h-8 stroke-[2.5]" /> : <MailCheck className="w-8 h-8" />}
              </div>

              {confirmKind === 'signup' && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Enviamos um link de confirmação para <strong className="text-slate-800">{email.trim().toLowerCase()}</strong>.
                  Abra o e-mail e clique no link para ativar sua conta. Não chegou? Olhe a caixa de spam. Se você já tinha
                  cadastro com esse e-mail, é só entrar normalmente.
                </p>
              )}
              {confirmKind === 'reset' && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Se <strong className="text-slate-800">{email.trim().toLowerCase()}</strong> estiver cadastrado, você vai
                  receber um link para criar uma nova senha. Confira também a caixa de spam.
                </p>
              )}
              {confirmKind === 'newpass' && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Tudo certo! Sua senha foi alterada e você já está conectado.
                </p>
              )}

              <button
                type="button"
                onClick={confirmKind === 'newpass' ? closeAuthModal : () => setAuthView('login')}
                className="w-full bg-[#004F8A] hover:bg-[#003866] text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer"
              >
                {confirmKind === 'newpass' ? 'Concluir' : 'Ir para o login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
