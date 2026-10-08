'use client';

/**
 * CAS — Miniaturas SVG dos itens do catálogo (silhuetas preenchidas com cor,
 * estilo dos cartões de roupa do The Sims 4).
 */

const STROKE = 'rgba(15,42,70,0.28)';

interface ThumbProps {
  itemId: string;
  color: string;
  size?: number;
}

export function GarmentThumb({ itemId, color, size = 40 }: ThumbProps) {
  const common = {
    fill: color,
    stroke: STROKE,
    strokeWidth: 1,
    strokeLinejoin: 'round' as const,
  };

  const content = (() => {
    switch (itemId) {
      /* ---------------- cabelos ---------------- */
      case 'careca':
        return (
          <g fill="none" stroke="rgba(15,42,70,0.30)" strokeWidth="1.6" strokeDasharray="3 2.4">
            <circle cx="12" cy="11" r="6.5" />
          </g>
        );
      case 'curto':
        return (
          <path {...common} d="M5 12 C4.4 6.4 8.2 4 12 4 C15.8 4 19.6 6.4 19 12 L16.6 12 C16.2 9.4 14.4 8.2 12 8.2 C9.6 8.2 7.8 9.4 7.4 12 Z" />
        );
      case 'medio':
        return (
          <g>
            <path {...common} d="M5 11.5 C4.4 6.2 8.2 3.8 12 3.8 C15.8 3.8 19.6 6.2 19 11.5 L16.4 11.5 C16 9 14.4 7.9 12 7.9 C9.6 7.9 8 9 7.6 11.5 Z" />
            <path {...common} d="M5 11 L7.4 11 C7.2 13.5 7.3 15.6 6.9 17.6 L4.9 17.2 C5.1 15 5 13 5 11 Z" />
            <path {...common} d="M19 11 L16.6 11 C16.8 13.5 16.7 15.6 17.1 17.6 L19.1 17.2 C18.9 15 19 13 19 11 Z" />
          </g>
        );
      case 'longo':
        return (
          <g>
            <path {...common} d="M4.6 11.5 C4 6 8.2 3.6 12 3.6 C15.8 3.6 20 6 19.4 11.5 L16.6 11.4 C16.2 8.8 14.4 7.6 12 7.6 C9.6 7.6 7.8 8.8 7.4 11.4 Z" />
            <path {...common} d="M4.8 10.5 L7.4 10.8 C7.2 14.5 7.5 18.2 6.6 21 L3.9 20.6 C4.6 17.5 4.6 13.8 4.8 10.5 Z" />
            <path {...common} d="M19.2 10.5 L16.6 10.8 C16.8 14.5 16.5 18.2 17.4 21 L20.1 20.6 C19.4 17.5 19.4 13.8 19.2 10.5 Z" />
          </g>
        );
      case 'coque':
        return (
          <g>
            <circle {...common} cx="12" cy="4.4" r="2.6" />
            <path {...common} d="M5 12.5 C4.4 7 8.2 5.4 12 5.4 C15.8 5.4 19.6 7 19 12.5 L16.5 12.5 C16.1 10 14.4 8.9 12 8.9 C9.6 8.9 7.9 10 7.5 12.5 Z" />
          </g>
        );
      case 'rabo':
        return (
          <g>
            <path {...common} d="M5 12 C4.4 6.4 8.2 4 12 4 C15.8 4 19.6 6.4 19 12 L16.6 12 C16.2 9.4 14.4 8.2 12 8.2 C9.6 8.2 7.8 9.4 7.4 12 Z" />
            <path {...common} d="M18.6 10.5 C21 11.5 21.6 14.8 20.4 17.6 C19.8 19 18.6 19.6 17.8 19.2 C17.2 18.8 17.3 18 17.9 17.2 C19 15.6 19.2 13 18 11.6 Z" />
          </g>
        );

      /* ---------------- tops ---------------- */
      case 'camiseta':
        return (
          <path {...common} d="M8.6 3.4 L5.2 4.9 L2.6 8.9 L5.3 10.5 L6.3 9.4 L6.3 20.2 L17.7 20.2 L17.7 9.4 L18.7 10.5 L21.4 8.9 L18.8 4.9 L15.4 3.4 C14.5 5.3 9.5 5.3 8.6 3.4 Z" />
        );
      case 'regata':
        return (
          <path {...common} d="M8.8 3 L10.6 3 L10.6 6.1 C11.5 6.9 12.5 6.9 13.4 6.1 L13.4 3 L15.2 3 L16.8 5.4 L15.9 8.3 L15.9 20.2 L8.1 20.2 L8.1 8.3 L7.2 5.4 Z" />
        );
      case 'moletom':
        return (
          <g>
            <path {...common} d="M8.6 4.4 L5.2 5.6 L2.6 9.4 L5.3 10.9 L6.3 9.9 L6.3 20.4 L17.7 20.4 L17.7 9.9 L18.7 10.9 L21.4 9.4 L18.8 5.6 L15.4 4.4 C14.6 6.1 9.4 6.1 8.6 4.4 Z" />
            <path d="M12 4.2 C9.8 4.2 8.9 5.5 9 6.7 L10.2 6.3 C10.9 5.5 13.1 5.5 13.8 6.3 L15 6.7 C15.1 5.5 14.2 4.2 12 4.2 Z" fill="rgba(255,255,255,0.45)" stroke={STROKE} strokeWidth="0.8" />
            <rect x="9.4" y="14.4" width="5.2" height="3.6" rx="1" fill="rgba(0,0,0,0.10)" stroke={STROKE} strokeWidth="0.7" />
          </g>
        );
      case 'sem_top':
        return <NoneMark />;

      /* ---------------- baixos ---------------- */
      case 'calca':
        return (
          <path {...common} d="M6.2 3.4 L17.8 3.4 L18.9 20.4 L14 20.4 L12.3 10.8 L11.4 10.8 L10 20.4 L5.1 20.4 Z" />
        );
      case 'shorts':
        return (
          <path {...common} d="M6.2 3.4 L17.8 3.4 L19 13.4 L13.9 13.4 L12 8.9 L10.1 13.4 L5 13.4 Z" />
        );
      case 'saia':
        return (
          <path {...common} d="M8.4 3.4 L15.6 3.4 L17.4 7.4 L20 16.8 L4 16.8 L6.6 7.4 Z" />
        );
      case 'nenhum':
        return <NoneMark />;

      /* ---------------- corpo inteiro ---------------- */
      case 'vestido':
        return (
          <path {...common} d="M9 3 C9.8 4.9 14.2 4.9 15 3 L16.2 6.6 L14.3 10.2 L19.4 20.4 L4.6 20.4 L9.7 10.2 L7.8 6.6 Z" />
        );
      case 'macacao':
        return (
          <g>
            <path {...common} d="M8.4 3 L10 3 L10 5.6 L14 5.6 L14 3 L15.6 3 L16.9 9.4 L15.7 9.9 L15.7 20.6 L12.9 20.6 L12.2 12.6 L11.1 12.6 L10.4 20.6 L7.6 20.6 L7.6 9.9 L6.4 9.4 Z" />
            <rect x="10.5" y="8" width="3" height="2.2" rx="0.6" fill="rgba(255,255,255,0.5)" stroke={STROKE} strokeWidth="0.6" />
          </g>
        );

      /* ---------------- acessórios ---------------- */
      case 'brincos':
        return (
          <g fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
            <path d="M6.4 6.2 C5.4 7.6 5.3 9 5.4 10.4" />
            <path d="M17.6 6.2 C18.6 7.6 18.7 9 18.6 10.4" />
            <circle cx="5.6" cy="13.4" r="2.5" fill={color} stroke={STROKE} strokeWidth="0.8" />
            <circle cx="18.4" cy="13.4" r="2.5" fill={color} stroke={STROKE} strokeWidth="0.8" />
          </g>
        );
      case 'colar':
        return (
          <g fill="none" strokeLinecap="round">
            <path d="M5.4 4.6 C5.4 11 9 13.6 12 13.6 C15 13.6 18.6 11 18.6 4.6" stroke={color} strokeWidth="1.8" />
            <circle cx="12" cy="15.6" r="2.7" fill={color} stroke={STROKE} strokeWidth="0.8" />
          </g>
        );
      case 'bone':
        return (
          <g>
            <path {...common} d="M4.6 12.6 A7.4 7.4 0 0 1 19.4 12.6 L19.4 13.4 L4.6 13.4 Z" />
            <path {...common} d="M4.4 13.4 L15.6 13.4 C18.8 13.4 20.4 14.6 20.4 15.6 L12 15.6 C7 15.6 4.4 14.9 4.4 13.4 Z" />
          </g>
        );
      case 'sem_acessorio':
        return <NoneMark />;

      /* ---------------- óculos ---------------- */
      case 'redondo':
        return (
          <g fill="none" stroke={color} strokeWidth="1.7">
            <circle cx="6.9" cy="12.4" r="3.6" />
            <circle cx="17.1" cy="12.4" r="3.6" />
            <path d="M10.5 11.6 C11.4 10.9 12.6 10.9 13.5 11.6" strokeLinecap="round" />
            <path d="M3.3 11.2 L3.9 10.4 M20.7 11.2 L20.1 10.4" strokeLinecap="round" />
          </g>
        );
      case 'quadrado':
        return (
          <g fill="none" stroke={color} strokeWidth="1.7">
            <rect x="3.2" y="8.8" width="7.4" height="6.2" rx="1.4" />
            <rect x="13.4" y="8.8" width="7.4" height="6.2" rx="1.4" />
            <path d="M10.6 11.4 C11.4 10.8 12.6 10.8 13.4 11.4" strokeLinecap="round" />
          </g>
        );
      case 'escuro':
        return (
          <g stroke={color} strokeWidth="1.6">
            <path d="M3.4 9.4 L20.6 9.4 L20.2 10.8 L19.6 10.4 L4.4 10.4 L3.8 10.8 Z" fill={color} stroke="none" />
            <rect x="4" y="10" width="6.8" height="5.4" rx="1.4" fill={color} />
            <rect x="13.2" y="10" width="6.8" height="5.4" rx="1.4" fill={color} />
            <path d="M10.8 11.2 C11.4 10.7 12.6 10.7 13.2 11.2" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'sem_oculos':
        return <NoneMark />;

      default:
        return <NoneMark />;
    }
  })();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {content}
    </svg>
  );
}

function NoneMark() {
  return (
    <g fill="none" stroke="rgba(15,42,70,0.30)" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="7.4" strokeDasharray="3 2.4" />
      <path d="M7 7 L17 17" />
    </g>
  );
}
