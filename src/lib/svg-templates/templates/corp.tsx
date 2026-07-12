import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert; eventName: string; orgName: string; logoUrls: string[]; sigImgs: (string | null)[];
}

export function drawCorpSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => !['Name','Email','Signatories','template','Template'].includes(k));
  let parsedSigs: any[] = [];
  try { parsedSigs = cert.fields?.Signatories ? (Array.isArray(cert.fields.Signatories) ? cert.fields.Signatories : JSON.parse(cert.fields.Signatories)) : []; } catch {}

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="select-none">
      {/* Clean white background */}
      <rect width="960" height="700" fill="#FFFFFF" />

      {/* Navy header bar */}
      <rect x="0" y="0" width="960" height="120" fill="#1E3A6E" />
      {/* Blue accent stripe */}
      <rect x="0" y="120" width="960" height="6" fill="#2E6BC8" />
      {/* Light blue secondary stripe */}
      <rect x="0" y="126" width="960" height="2" fill="#89B4E8" />

      {/* Navy footer */}
      <rect x="0" y="668" width="960" height="32" fill="#1E3A6E" />
      <rect x="0" y="666" width="960" height="2" fill="#2E6BC8" />

      {/* Left sidebar accent */}
      <rect x="0" y="128" width="8" height="538" fill="#1E4DA1" />

      {/* Watermark circle */}
      <circle cx="480" cy="380" r="220" fill="none" stroke="#E8EEF8" strokeWidth="60" />

      {/* Org name in header */}
      <text x="44" y="58" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="Georgia, serif" letterSpacing="1">{orgName}</text>
      <text x="44" y="82" fill="#89B4E8" fontSize="10" fontFamily="monospace" letterSpacing="2">CERTIFICATE ISSUING AUTHORITY</text>

      {/* Top right blockchain badge */}
      <rect x="740" y="28" width="188" height="64" fill="#FFFFFF" opacity="0.1" rx="2" />
      <text x="834" y="54" fill="#FFFFFF" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1">BLOCKCHAIN VERIFIED</text>
      <text x="834" y="68" fill="#89B4E8" fontSize="8" fontFamily="monospace" textAnchor="middle">◆ ZEROCERT PROTOCOL ◆</text>
      <text x="834" y="82" fill="#FFFFFF" fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.7">{certId}</text>

      {/* Certificate title */}
      <text x="480" y="196" fill="#1E3A6E" fontSize="42" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="2">CERTIFICATE</text>
      <text x="480" y="224" fill="#2E6BC8" fontSize="16" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="6">OF ACHIEVEMENT</text>

      {/* Double line divider */}
      <line x1="80" y1="240" x2="880" y2="240" stroke="#1E4DA1" strokeWidth="1.5" />
      <line x1="80" y1="244" x2="880" y2="244" stroke="#89B4E8" strokeWidth="0.5" />

      <text x="480" y="278" fill="#5577AA" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">This is to certify that</text>

      {/* Recipient name */}
      <text x="480" y="352" fill="#0D1A2E" fontSize="50" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{name}</text>
      <line x1="240" y1="368" x2="720" y2="368" stroke="#2E6BC8" strokeWidth="1.5" />

      <text x="480" y="404" fill="#5577AA" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">has successfully completed</text>
      <text x="480" y="440" fill="#1E3A6E" fontSize="24" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{eventName}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={468 + idx * 16} fill="#7799BB" fontSize="10" fontFamily="monospace" textAnchor="middle">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${506 + extras.length * 16})`} textAnchor="middle" fill="#8899AA" fontSize="10" fontFamily="monospace">
        <text y="0">Date of Issue: {issued}</text>
        <text y="14">Certificate No: {certId}</text>
        <text y="28" fontSize="8" fill="#AABBCC">SHA-256: {hash.slice(0,52)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'cursive';
        return (
          <g key={i} transform="translate(0, 575)">
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-28" width="100" height="28" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="0" fill="#1E3A6E" fontSize="22" fontFamily={sigFont} textAnchor="middle">{sig.signatureData}</text>
            ) : null}
            <line x1={bx + 10} y1="10" x2={bx + blockW - 10} y2="10" stroke="#1E4DA1" strokeWidth="1" />
            <text x={cx} y="26" fill="#1E3A6E" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{sig.name || ''}</text>
            <text x={cx} y="38" fill="#5577AA" fontSize="9" fontFamily="monospace" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      <text x="480" y="683" fill="#89B4E8" fontSize="8" fontFamily="monospace" textAnchor="middle">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={884 - (i + 1) * 70} y="30" width="58" height="56" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
