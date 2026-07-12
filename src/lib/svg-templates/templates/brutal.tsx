import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert; eventName: string; orgName: string; logoUrls: string[]; sigImgs: (string | null)[];
}

export function drawBrutalSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => !['Name','Email','Signatories','template','Template'].includes(k));
  let parsedSigs: any[] = [];
  try { parsedSigs = cert.fields?.Signatories ? (Array.isArray(cert.fields.Signatories) ? cert.fields.Signatories : JSON.parse(cert.fields.Signatories)) : []; } catch {}

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="select-none">
      {/* Background: white with brutal black elements */}
      <rect width="960" height="700" fill="#F5F500" />
      <rect x="0" y="0" width="960" height="700" fill="#FFFFFF" />

      {/* Big black offset block top */}
      <rect x="0" y="0" width="960" height="110" fill="#111111" />
      {/* Yellow accent bar */}
      <rect x="0" y="110" width="960" height="8" fill="#F5F500" />

      {/* Thick black left bar */}
      <rect x="0" y="0" width="18" height="700" fill="#111111" />
      {/* Thick black right bar */}
      <rect x="942" y="0" width="18" height="700" fill="#111111" />
      {/* Bottom bar */}
      <rect x="0" y="668" width="960" height="32" fill="#111111" />

      {/* Org block */}
      <text x="42" y="52" fill="#F5F500" fontSize="16" fontWeight="900" fontFamily="'Arial Black', monospace" letterSpacing="4">{orgName.toUpperCase()}</text>
      <text x="42" y="88" fill="#888888" fontSize="10" fontFamily="monospace" letterSpacing="2">CERTIFICATE AUTHORITY</text>

      {/* Top right stamp */}
      <rect x="760" y="20" width="160" height="70" fill="#F5F500" />
      <text x="840" y="52" fill="#111111" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">BLOCKCHAIN</text>
      <text x="840" y="66" fill="#111111" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">VERIFIED</text>
      <text x="840" y="80" fill="#111111" fontSize="7" fontFamily="monospace" textAnchor="middle">◆ ZEROCERT ◆</text>

      {/* CERTIFICATE heading */}
      <text x="42" y="200" fill="#111111" fontSize="76" fontWeight="900" fontFamily="'Arial Black', Impact, sans-serif" letterSpacing="-2">CERT</text>
      <text x="42" y="270" fill="#111111" fontSize="76" fontWeight="900" fontFamily="'Arial Black', Impact, sans-serif" letterSpacing="-2">IFICATE</text>

      {/* Black diagonal slash decoration */}
      <line x1="560" y1="130" x2="700" y2="280" stroke="#111111" strokeWidth="3" />
      <line x1="580" y1="130" x2="720" y2="280" stroke="#F5F500" strokeWidth="1.5" />

      {/* OF COMPLETION text */}
      <rect x="42" y="278" width="380" height="28" fill="#111111" />
      <text x="50" y="298" fill="#F5F500" fontSize="14" fontWeight="900" fontFamily="monospace" letterSpacing="4">OF COMPLETION</text>

      {/* Divider */}
      <rect x="42" y="318" width="875" height="3" fill="#111111" />

      {/* Name */}
      <text x="480" y="395" fill="#111111" fontSize="52" fontWeight="900" fontFamily="'Arial Black', Impact, sans-serif" textAnchor="middle">{name}</text>
      <rect x="200" y="405" width="560" height="3" fill="#F5F500" />

      <text x="480" y="440" fill="#555555" fontSize="13" fontFamily="monospace" textAnchor="middle" letterSpacing="2">FOR COMPLETING — {eventName.toUpperCase()}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={464 + idx * 16} fill="#777777" fontSize="10" fontFamily="monospace" textAnchor="middle">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${506 + extras.length * 16})`} textAnchor="middle" fill="#999999" fontSize="10" fontFamily="monospace">
        <text y="0">Issued: {issued} · ID: {certId}</text>
        <text y="14" fontSize="8" fill="#BBBBBB">SHA: {hash.slice(0,52)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 875 / parsedSigs.length;
        const bx = 42 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'cursive';
        return (
          <g key={i} transform="translate(0, 578)">
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-28" width="100" height="28" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="0" fill="#111111" fontSize="22" fontFamily={sigFont} textAnchor="middle">{sig.signatureData}</text>
            ) : null}
            <rect x={bx + 10} y="10" width={blockW - 20} height="3" fill="#111111" />
            <text x={cx} y="24" fill="#111111" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">{(sig.name || '').toUpperCase()}</text>
            <text x={cx} y="36" fill="#666666" fontSize="9" fontFamily="monospace" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      <text x="480" y="683" fill="#888888" fontSize="8" fontFamily="monospace" textAnchor="middle">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={900 - (i + 1) * 65} y="22" width="55" height="55" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
