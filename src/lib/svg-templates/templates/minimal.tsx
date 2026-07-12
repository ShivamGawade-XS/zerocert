import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

export function drawMinimalSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const extras = Object.entries(cert.fields || {}).filter(
    ([k]) => k !== 'Name' && k !== 'Email' && k !== 'Signatories' && k !== 'template' && k !== 'Template'
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

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="font-mono select-none">
      {/* Background */}
      <rect width="960" height="700" fill="#FEFEFE" />

      {/* Thin Hairline frame */}
      <rect x="32" y="32" width="896" height="636" fill="none" stroke="#F0F0F0" strokeWidth="1" />

      {/* Decorative vertical bar top-left */}
      <rect x="32" y="88" width="160" height="1" fill="#000000" />

      {/* Org Name */}
      <text x="914" y="56" fill="#000000" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="end">
        {orgName.toUpperCase()}
      </text>
      <text x="914" y="72" fill="#CCCCCC" fontSize="9" fontFamily="monospace" textAnchor="end">
        ZEROCERT.APP
      </text>

      {/* Certificate Title */}
      <text x="480" y="208" fill="#000000" fontSize="72" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        Certificate
      </text>
      <text x="480" y="238" fill="#AAAAAA" fontSize="14" fontFamily="Georgia, serif" textAnchor="middle">
        of Completion
      </text>

      <line x1="420" y1="256" x2="540" y2="256" stroke="#E8E8E8" strokeWidth="1" />

      <text x="480" y="292" fill="#999999" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        awarded to
      </text>

      {/* Recipient Name */}
      <text x="480" y="364" fill="#000000" fontSize="52" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {name}
      </text>
      <line x1="280" y1="380" x2="680" y2="380" stroke="#000000" strokeWidth="0.5" />

      <text x="480" y="418" fill="#999999" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        for completing
      </text>

      {/* Event Name */}
      <text x="480" y="452" fill="#000000" fontSize="22" fontWeight="normal" fontFamily="Georgia, serif" textAnchor="middle">
        {eventName}
      </text>

      {/* Extra Fields */}
      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={472 + idx * 16} fill="#AAAAAA" fontSize="10" fontFamily="monospace" textAnchor="middle">
          {k}: {String(v)}
        </text>
      ))}

      {/* Footer Info */}
      <text x="480" y={492 + extras.length * 16} fill="#CCCCCC" fontSize="10" fontFamily="monospace" textAnchor="middle">
        {issued}  ·  ID {certId}
      </text>

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
              <text x={cx} y="2" fill="#000000" fontSize="22" fontStyle="italic" fontFamily="cursive" textAnchor="middle">
                {sig.signatureData}
              </text>
            ) : null}

            {/* Signature Line */}
            <line x1={bx + 15} y1="10" x2={bx + blockW - 15} y2="10" stroke="#CCCCCC" strokeWidth="1" />

            {/* Signatory Name */}
            <text x={cx} y="24" fill="#222222" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {(sig.name || '').toUpperCase()}
            </text>

            {/* Designation */}
            <text x={cx} y="36" fill="#888888" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
              {sig.designation || ''}
            </text>
          </g>
        );
      })}

      <line x1="32" y1="656" x2="928" y2="656" stroke="#EBEBEB" strokeWidth="1" />
      <text x="480" y="672" fill="#CCCCCC" fontSize="8" fontFamily="monospace" textAnchor="middle">
        VERIFY AT ZEROCERT.APP
      </text>

      {/* Organization logos */}
      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={46 + i * 50} y="36" width="38" height="38" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
