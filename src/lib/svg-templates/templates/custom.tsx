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
  const bgColor = cert.fields?.bg_color || cert.fields?.bgColor || '#FFFFFF';
  const textColor = cert.fields?.text_color || cert.fields?.textColor || '#111111';
  const accentColor = cert.fields?.accent_color || cert.fields?.accentColor || '#B8922A';

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="font-mono select-none">
      {/* Background color */}
      <rect width="960" height="700" fill={bgColor} />

      {/* Custom Background Image if uploaded */}
      {bgImg && (
        <image href={bgImg} x="0" y="0" width="960" height="700" preserveAspectRatio="xMidYMid slice" />
      )}

      {/* Overlay text elements centered */}
      {/* Organization Name */}
      <text x="480" y="110" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="2" opacity="0.8">
        {orgName.toUpperCase()}
      </text>

      <text x="480" y="180" fill={accentColor} fontSize="20" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="4">
        CERTIFICATE OF COMPLETION
      </text>

      <text x="480" y="250" fill={textColor} fontSize="16" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.6">
        This is proudly presented to
      </text>

      {/* Recipient Name */}
      <text x="480" y="324" fill={textColor} fontSize="52" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {name}
      </text>
      <line x1="300" y1="340" x2="660" y2="340" stroke={accentColor} strokeWidth="1" />

      <text x="480" y="380" fill={textColor} fontSize="15" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.6">
        for active participation in
      </text>

      {/* Event Name */}
      <text x="480" y="416" fill={textColor} fontSize="26" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {eventName}
      </text>

      {/* Extra fields */}
      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={446 + idx * 16} fill={textColor} fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.7">
          {k}: {String(v)}
        </text>
      ))}

      {/* Expiry / Verification details */}
      <g transform={`translate(480, ${500 + extras.length * 16})`} textAnchor="middle" fill={textColor} fontSize="10" fontFamily="monospace" opacity="0.7">
        <text y="0">Issued On: {issued}</text>
        <text y="14">Verification ID: {certId}</text>
        <text y="26" fontSize="8" opacity="0.8">SHA-256: {hash.slice(0, 48)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];

        return (
          <g key={i} transform="translate(0, 560)">
            {/* Signature image or typed */}
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-30" width="100" height="36" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="2" fill={textColor} fontSize="22" fontStyle="italic" fontFamily="cursive" textAnchor="middle">
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
              {sig.designation || ''}
            </text>
          </g>
        );
      })}

      {/* Verify bottom tag */}
      <text x="480" y="684" fill={textColor} opacity="0.5" fontSize="8" fontFamily="monospace" textAnchor="middle">
        Verify at zerocert.app/verify?id={certId}
      </text>

      {/* Organization logos if background isn't too cluttered */}
      {!bgImg && logoUrls.map((url, i) => (
        <image key={url} href={url} x={48 + i * 50} y="36" width="38" height="38" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
