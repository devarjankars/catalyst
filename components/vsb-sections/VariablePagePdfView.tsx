"use client"

interface NormalSection {
  heading: string;
  options: string[];
  structure: 'normal';
  listText?: string | null;
}

interface TableSection {
  heading: string;
  options: Array<{
    fromEmail: string;
    friendlyNames: string[];
  }>;
  structure: 'table';
  listText?: null;
}

interface ThirdPartySection {
  heading: string;
  options: string[];
  structure: 'third-party-placeholder';
  listText?: null;
}

type Section = NormalSection | TableSection | ThirdPartySection;

// ─── Structure renderers (read-only) ──────────────────────────────────────────

const NormalView = ({ section }: { section: NormalSection }) => {
  const listLabel = section.listText ?? 'Option';

  return (
    <>
      {section.options.map((opt, i) => {
        const isString = typeof opt === 'string';
        const isImage = isString && (opt.startsWith('data:image') || opt.startsWith('http'));

        return (
          <div key={i} className="text-[10px] text-black mb-2">
            <span className="font-bold mr-2">{listLabel} {i + 1}:</span>
            {isString ? (
              isImage ? (
                <img
                  src={opt}
                  alt={`${listLabel} {i + 1}`}
                  className="mt-1 border border-gray-100 w-[600px]"
                  style={{  maxWidth: '600px', display: 'inline-block' }}
                />
              ) : (
                <span>{opt}</span>
              )
            ) : (
              <pre className="mt-1 text-[9px] text-gray-500 bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(opt, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </>
  );
};

const TableView = ({ section }: { section: TableSection }) => (
  <table
    style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}
  >
    <thead>
      <tr style={{ background: '#f9f9f9' }}>
        <th style={thStyle}>Friendly From Name</th>
        <th style={thStyle}>From Email Address</th>
      </tr>
    </thead>
    <tbody>
      {section.options.map((row, i) => (
        <tr key={i}>
          <td style={tdStyle}>
            {row.friendlyNames.map((name, j) => (
              <div key={j} style={{ marginBottom: 3 }}>
                <span style={{ fontWeight: 700, marginRight: 4 }}>{j + 1}.</span>
                {name}
              </div>
            ))}
          </td>
          <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
            {row.fromEmail}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const thStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '6px 8px',
  fontWeight: 700,
  textAlign: 'center',
  color: '#FF66CC',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '6px 8px',
  verticalAlign: 'top',
};

const ThirdPartyView = ({ section }: { section: ThirdPartySection }) => {
  return section.options.length > 0 ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      {section.options.map((op, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "10px 1fr 10px",
            gap: "2px",
            alignItems : "center",
          }}
        >
          <p style={{color : "#FF66CC",fontSize : "50px"}}>[</p>
          <p style={{flex : 1,textAlign:"center"}}>{op}</p>
          <p style={{color : "#FF66CC",fontSize : "50px"}}>]</p>
        </div>
      ))}
    </div>
  ) : null;
};

// ─── Main component ────────────────────────────────────────────────────────────

const VariablePagePdfView = ({
  emailname,
  data,
  headingColor,
}: {
  emailname: string;
  data: Section[];
  headingColor?: string;
}) => {
  const accent = headingColor || '#FF66CC';

  return (
    <div className="w-full max-w-[600px] bg-white p-4">
      <h1 className="text-[13px] text-[#006937] font-bold mb-2">{emailname}</h1>
      <h3 className="text-[11px] font-bold mb-3" style={{ color: accent }}>
        Variable copy
      </h3>

      {data?.map((section, index) => (
        <div key={index} className="mb-4">
          {/* Section heading */}
         {section.structure === "third-party-placeholder" ? null :<h2 className="text-[11px] font-bold mb-1" style={{ color: accent }}>
            {section.heading}
          </h2>}

          {/* Structure-aware content */}
          {section.structure === 'table' ? (
            <TableView section={section as TableSection} />
          ) : section.structure === 'third-party-placeholder' ? (
            <ThirdPartyView section={section as ThirdPartySection} />
          ) : (
            <NormalView section={section as NormalSection} />
          )}
        </div>
      ))}
    </div>
  );
};

export default VariablePagePdfView;