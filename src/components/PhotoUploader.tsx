import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { translateDbError } from '../lib/validation';

interface PhotoUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  /** subpasta dentro da pasta do usuário (ex.: id do estabelecimento) */
  folder: string;
  max: number;
  label?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ urls, onChange, folder, max, label = 'Adicionar foto' }) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setError(null);
    setBusy(true);
    let current = urls;
    try {
      for (const file of Array.from(files)) {
        if (current.length >= max) break;
        const url = await api.uploadFoto(file, user.id, folder);
        current = [...current, url];
        onChange(current);
      }
    } catch (err) {
      setError(translateDbError(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => {
    onChange(urls.filter((u) => u !== url));
    void api.removerFoto(url).catch(() => undefined);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {urls.map((url) => (
          <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label="Remover foto"
              className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-[#4FA8D8] hover:text-[#004F8A] flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            {busy ? 'Enviando' : label}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <p className="text-[11px] text-slate-500 mt-1.5">JPG, PNG ou WebP, até 20 MB. A foto é reduzida automaticamente antes de enviar. Máximo de {max}.</p>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
};
