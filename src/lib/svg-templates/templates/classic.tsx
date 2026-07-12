import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

export function drawClassicSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
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
      <rect width="960" height="700" fill="#FAFAF3" />

      {/* Gold Borders */}
      <rect x="14" y="14" width="932" height="672" fill="none" stroke="#B8922A" strokeWidth="10" />
      <rect x="26" y="26" width="908" height="648" fill="none" stroke="#D4AF60" strokeWidth="1.5" />

      {/* Corner Ornaments */}
      <rect x="34" y="34" width="52" height="52" fill="none" stroke="#D4AF6055" strokeWidth="1" />
      <rect x="874" y="34" width="52" height="52" fill="none" stroke="#D4AF6055" strokeWidth="1" />
      <rect x="34" y="614" width="52" height="52" fill="none" stroke="#D4AF6055" strokeWidth="1" />
      <rect x="874" y="614" width="52" height="52" fill="none" stroke="#D4AF6055" strokeWidth="1" />

      {/* Header Banner */}
      <rect x="32" y="32" width="896" height="90" fill="#0A0A1C" />
      <rect x="32" y="32" width="7" height="90" fill="#E8FF00" />

      {/* Org Name */}
      <text x="54" y="82" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="monospace">
        {orgName.toUpperCase()}
      </text>

      {/* Top Right Label */}
      <text x="912" y="82" fill="#E8FF00" fontSize="10" fontWeight="600" fontFamily="monospace" textAnchor="end">
        ZEROCERT · BLOCKCHAIN VERIFIED
      </text>

      {/* Certificate Title */}
      <text x="480" y="200" fill="#12102A" fontSize="56" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        CERTIFICATE
      </text>
      <text x="480" y="228" fill="#8A6820" fontSize="19" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="2">
        OF COMPLETION
      </text>

      {/* Dividers */}
      <line x1="80" y1="244" x2="880" y2="244" stroke="#B8922A" strokeWidth="1" opacity="0.6" />

      {/* Body text */}
      <text x="480" y="280" fill="#9A7A50" fontSize="16" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        This is to certify that
      </text>

      {/* Recipient Name */}
      <text x="480" y="344" fill="#08081E" fontSize="50" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {name}
      </text>
      <line x1="280" y1="358" x2="680" y2="358" stroke="#B8922A" strokeWidth="1" />

      {/* Event Details */}
      <text x="480" y="390" fill="#9A7A50" fontSize="16" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        has successfully completed
      </text>
      <text x="480" y="424" fill="#08081E" fontSize="26" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {eventName}
      </text>

      {/* Extra Fields */}
      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={448 + idx * 16} fill="#777777" fontSize="10" fontFamily="monospace" textAnchor="middle">
          {k}: {String(v)}
        </text>
      ))}

      {/* Footer Info */}
      <g transform={`translate(480, ${510 + extras.length * 16})`} textAnchor="middle" fill="#777777" fontSize="10" fontFamily="monospace">
        <text y="0">Issued: {issued}</text>
        <text y="16">ID: {certId}</text>
        <text y="30" fill="#999999" fontSize="9">SHA-256: {hash.slice(0, 44)}…</text>
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
              <text x={cx} y="2" fill="#08081E" fontSize="22" fontStyle="italic" fontFamily="cursive" textAnchor="middle">
                {sig.signatureData}
              </text>
            ) : null}

            {/* Signature Line */}
            <line x1={bx + 15} y1="10" x2={bx + blockW - 15} y2="10" stroke="#B8922A" strokeWidth="1" />

            {/* Signatory Name */}
            <text x={cx} y="24" fill="#222222" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {(sig.name || '').toUpperCase()}
            </text>

            {/* Designation */}
            <text x={cx} y="36" fill="#9A7A50" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
              {sig.designation || ''}
            </text>
          </g>
        );
      })}

      {/* Official Blockchain Seal */}
      <g transform="translate(850, 590)">
        <circle cx="0" cy="0" r="52" fill="#0A0A1C" stroke="#E8FF00" strokeWidth="2" />
        <text x="0" y="-8" fill="#E8FF00" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">BLOCKCHAIN</text>
        <text x="0" y="4" fill="#E8FF00" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ANCHORED</text>
        <text x="0" y="16" fill="#888888" fontSize="7" fontFamily="monospace" textAnchor="middle">ZEROCERT</text>
      </g>

      <line x1="80" y1="672" x2="880" y2="672" stroke="#DDDDDD" strokeWidth="0.5" />
      <text x="480" y="688" fill="#999999" fontSize="8" fontFamily="monospace" textAnchor="middle">
        Verify at zerocert.app/verify — {certId}
      </text>

      {/* Organization logos */}
      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={880 - (i + 1) * 70} y="44" width="60" height="60" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
