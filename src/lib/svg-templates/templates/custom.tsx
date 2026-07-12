import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

export function drawCustomSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const extras = Object.entries(cert.fields || {}).filter(
    ([k]) => k !== 'Name' && k !== 'Email' && k !== 'Signatories' && k !== 'template' && k !== 'Template' && k !== 'bg_image' && k !== 'bgImage' && k !== 'bg_color' && k !== 'textColor'
  );

  let parsedSigs: any[] = [];
  if (cert.fields?.Signatories) {
    try {
      parsedSigs = Array.isArray(cert.fields.Signatories)
        ? cert.fields.Signatories
        : JSON.parse(cert.fields.Signatories);
    } catch (e) {
      console.error(e);
    }
  }

  // Extract custom background image, background color, and text color if provided
  const bgImg = cert.fields?.bg_image || cert.fields?.bgImage || null;
  const bgColorRaw = cert.fields?.bg_color || cert.fields?.bgColor || '#FFFFFF';
  const textColor = cert.fields?.text_color || cert.fields?.textColor || '#111111';
  const accentColor = cert.fields?.accent_color || cert.fields?.accentColor || '#B8922A';

  let parsedLayout: any = {};
  let finalBgColor = bgColorRaw;
  if (bgColorRaw.trim().startsWith('{')) {
    try {
      parsedLayout = JSON.parse(bgColorRaw);
      finalBgColor = parsedLayout.bgColor || '#FFFFFF';
    } catch (e) {
      console.error('Failed to parse custom layout JSON:', e);
    }
  }

  const titleY = parsedLayout.titleY ?? 180;
  const nameY = parsedLayout.nameY ?? 324;
  const eventY = parsedLayout.eventY ?? 416;
  const sigsY = parsedLayout.sigsY ?? 560;
  const titleSize = parsedLayout.titleSize ?? 20;
  const nameSize = parsedLayout.nameSize ?? 52;
  const eventSize = parsedLayout.eventSize ?? 26;
  const canvasWidth = parsedLayout.canvasWidth ?? 960;
  const canvasHeight = parsedLayout.canvasHeight ?? 700;

  const titleX = parsedLayout.titleX ?? canvasWidth / 2;
  const nameX = parsedLayout.nameX ?? canvasWidth / 2;
  const eventX = parsedLayout.eventX ?? canvasWidth / 2;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} xmlns="http://www.w3.org/2000/svg" className="font-mono select-none">
      {/* Background color */}
      <rect width={canvasWidth} height={canvasHeight} fill={finalBgColor} />

      {/* Custom Background Image if uploaded */}
      {bgImg && (
        <image href={bgImg} x="0" y="0" width={canvasWidth} height={canvasHeight} preserveAspectRatio="xMidYMid slice" />
      )}

      {/* Overlay text elements centered */}
      {/* Organization Name */}
      <text x={titleX} y="110" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="2" opacity="0.8">
        {orgName.toUpperCase()}
      </text>

      <text x={titleX} y={titleY} fill={accentColor} fontSize={titleSize} fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="4">
        CERTIFICATE OF COMPLETION
      </text>

      <text x={nameX} y={nameY - 74} fill={textColor} fontSize="16" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.6">
        This is proudly presented to
      </text>

      {/* Recipient Name */}
      <text x={nameX} y={nameY} fill={textColor} fontSize={nameSize} fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {name}
      </text>
      <line x1={nameX - 180} y1={nameY + 16} x2={nameX + 180} y2={nameY + 16} stroke={accentColor} strokeWidth="1" />

      <text x={eventX} y={eventY - 36} fill={textColor} fontSize="15" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.6">
        for active participation in
      </text>

      {/* Event Name */}
      <text x={eventX} y={eventY} fill={textColor} fontSize={eventSize} fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {eventName}
      </text>

      {/* Extra fields */}
      {extras.map(([k, v], idx) => (
        <text key={k} x={eventX} y={eventY + 30 + idx * 16} fill={textColor} fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.7">
          {k}: {String(v)}
        </text>
      ))}

      {/* Expiry / Verification details */}
      <g transform={`translate(${eventX}, ${eventY + 84 + extras.length * 16})`} textAnchor="middle" fill={textColor} fontSize="10" fontFamily="monospace" opacity="0.7">
        <text y="0">Issued On: {issued}</text>
        <text y="14">Verification ID: {certId}</text>
        <text y="26" fontSize="8" opacity="0.8">SHA-256: {hash.slice(0, 48)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = (canvasWidth - 120) / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'Great Vibes, cursive';

        return (
          <g key={i} transform={`translate(0, ${sigsY})`}>
            {/* Signature image or typed */}
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-30" width="100" height="36" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="2" fill={textColor} fontSize="24" fontFamily={sigFont} textAnchor="middle">
                {sig.signatureData}
              </text>
            ) : null}

            {/* Signature Line */}
            <line x1={bx + 15} y1="10" x2={bx + blockW - 15} y2="10" stroke={accentColor} strokeWidth="1" opacity="0.5" />

            {/* Signatory Name */}
            <text x={cx} y="24" fill={textColor} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {(sig.name || '').toUpperCase()}
            </text>

            {/* Designation */}
            <text x={cx} y="36" fill={textColor} fontSize="9" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.7">
              {sig.designation || sig.title || ''}
            </text>
          </g>
        );
      })}

      {/* Verify bottom tag */}
      <text x={canvasWidth / 2} y={canvasHeight - 16} fill={textColor} opacity="0.5" fontSize="8" fontFamily="monospace" textAnchor="middle">
        Verify at certxchange.vercel.app/verify?id={certId}
      </text>

      {/* Organization logos if background isn't too cluttered */}
      {!bgImg && logoUrls.map((url, i) => (
        <image key={url} href={url} x={48 + i * 50} y="36" width="38" height="38" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
