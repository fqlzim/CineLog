/**
 * components/StarRating.jsx — Estrelas premium com dois modos visuais
 *
 * MODO display (Feed, Perfil, ReviewCard):
 *   → compacto (sm: ~26px), brilho suave, sem hover de preview
 *
 * MODO input (FilmeDetalhe → "Sua avaliação"):
 *   → grande (xl: ~64px), hover, animação, área de toque ampla
 *
 * PROP tamanho (ou size):
 *   xs | sm | md | lg | xl
 *   Se inválido (ex: "1rem" legado) → sm em display, xl em input
 *
 * REUTILIZAÇÃO:
 *   Um único componente + props evita duplicar JSX/CSS em cada tela.
 */

import { useState } from 'react';

const TAMANHOS_VALIDOS = ['xs', 'sm', 'md', 'lg', 'xl'];

function normalizarTamanho(tamanho, modo) {
  if (TAMANHOS_VALIDOS.includes(tamanho)) return tamanho;
  return modo === 'input' ? 'xl' : 'sm';
}

function IconeEstrela({ preenchida, preview, compacto }) {
  return (
    <svg
      className="star-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className={[
          'star-shape',
          preenchida ? 'star-shape--on' : '',
          preview ? 'star-shape--preview' : '',
          compacto ? 'star-shape--compact' : '',
        ].filter(Boolean).join(' ')}
        d="M12 2.5l2.89 5.85 6.46.94-4.68 4.56 1.1 6.43L12 17.9l-5.77 3.03 1.1-6.43L2.65 9.29l6.46-.94L12 2.5z"
      />
    </svg>
  );
}

function StarRating({
  nota = 0,
  onChange,
  modo = 'display',
  tamanho,
  size,
  mostrarPreview,
}) {
  const [hoverNota, setHoverNota] = useState(0);
  const estrelas = [1, 2, 3, 4, 5];

  const tamanhoFinal = normalizarTamanho(tamanho || size, modo);
  const ehInput = modo === 'input';
  const ehDisplay = !ehInput;
  const exibirLabel = mostrarPreview ?? ehInput;
  const compacto = ehDisplay;

  const notaVisual = ehInput && hoverNota > 0 ? hoverNota : nota;

  const classes = [
    'star-rating',
    `star-rating--${tamanhoFinal}`,
    ehInput ? 'star-rating--input' : 'star-rating--display',
  ].join(' ');

  const previewAtivo = ehInput && hoverNota > 0;
  const notaExibidaPreview = previewAtivo ? hoverNota : nota;

  return (
    <div className={`star-rating-wrap ${ehDisplay ? 'star-rating-wrap--inline' : ''}`}>
      <div
        className={classes}
        role={ehInput ? 'radiogroup' : 'img'}
        aria-label={`Avaliação: ${nota} de 5 estrelas`}
        onMouseLeave={() => ehInput && setHoverNota(0)}
      >
        {estrelas.map((valor) => {
          const preenchida = valor <= notaVisual;
          const emPreview = previewAtivo && valor <= hoverNota;
          const ativa = ehInput && valor === nota && !previewAtivo;

          if (ehInput && onChange) {
            return (
              <button
                key={valor}
                type="button"
                className={[
                  'star-btn',
                  preenchida ? 'filled' : '',
                  emPreview ? 'preview' : '',
                  ativa ? 'active' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onChange(valor)}
                onMouseEnter={() => setHoverNota(valor)}
                onFocus={() => setHoverNota(valor)}
                onBlur={() => setHoverNota(0)}
                aria-label={`${valor} de 5 estrelas`}
                aria-pressed={valor === nota}
              >
                <IconeEstrela preenchida={preenchida} preview={emPreview} compacto={false} />
              </button>
            );
          }

          return (
            <span
              key={valor}
              className={`star-display ${preenchida ? 'filled' : 'empty'}`}
            >
              <IconeEstrela preenchida={preenchida} compacto={compacto} />
            </span>
          );
        })}
      </div>

      {exibirLabel && ehInput && (
        <p className="star-preview-label" aria-live="polite">
          {notaExibidaPreview > 0
            ? `${notaExibidaPreview} de 5 estrelas`
            : 'Toque ou clique para avaliar'}
        </p>
      )}
    </div>
  );
}

export default StarRating;
