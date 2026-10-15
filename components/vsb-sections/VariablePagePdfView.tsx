import React from 'react';
import { getSenderRowSeparator } from '@/lib/sender-table-layout';
import { resolveEmailAssetUrl } from '@/lib/asset-url';

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
  const isImageSection = section.heading.toLowerCase().includes('header image');

  return (
    <>
      {section.options.map((opt, i) => {
        const isString = typeof opt === 'string';
        const trimmed = isString ? opt.trim() : '';
        // Skip empty options
        if (isString && trimmed === '') return null;
        const isImage = isString && (trimmed.startsWith('data:image') || trimmed.startsWith('http') || trimmed.startsWith('/'));

        return (
          <div key={i} className="text-[10px] text-black mb-[2px] w-[100%]">
            <span className="font-bold mr-2">{listLabel} {i + 1}:</span>
            {isString ? (
              isImage ? (
                <img
                  src={resolveEmailAssetUrl(opt, typeof window !== 'undefined' ? window.location.origin : undefined)}
                  alt={`${listLabel} ${i + 1}`}
                  className="mt-2 border border-gray-100 w-[80%] max-h-[150px] inline-block max-w-[400px]"
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
    style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: 9 }}
  >
    <thead>
      <tr style={{ background: '#f9f9f9' }}>
        <th style={{ ...thStyle, width: '50%' }}>Friendly From Name</th>
        <th style={{ ...thStyle, width: '50%' }}>From email address</th>
      </tr>
    </thead>
    <tbody>
      {section.options.map((row, i) => {
        const separator = getSenderRowSeparator(i, section.options.length);
        const borderTop = i > 0 && getSenderRowSeparator(i - 1, section.options.length) === 'double'
          ? 'none'
          : undefined;
        const cellStyle = separator === 'normal'
          ? { ...tdStyle, borderTop }
          : { ...tdStyle, borderBottom: 0, borderTop };
        return (
          <React.Fragment key={i}>
            <tr>
              <td style={{ ...cellStyle, paddingLeft: 8 }}>
                {row.friendlyNames.map((name, j) => (
                  <div key={j} style={{ marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, marginRight: 4 }}>{j + 1}.</span>
                    {name}
                  </div>
                ))}
              </td>
              <td style={{ ...cellStyle, paddingLeft: 25, verticalAlign: 'middle', textAlign: 'left' }}>
                {row.fromEmail}
              </td>
            </tr>
            {separator === 'double' && (
              <tr>
                <td style={{ width: '50%', height: 17, boxSizing: 'border-box', padding: 0, border: '1px solid #ddd' }} />
                <td style={{ width: '50%', height: 17, boxSizing: 'border-box', padding: 0, border: '1px solid #ddd' }} />
              </tr>
            )}
          </React.Fragment>
        );
      })}
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
            gridTemplateColumns: "25px 1fr 25px",
            gap: "2px",
            alignItems : "center",
          }}
        >
          <img src={"/sqr_bracket_left.png"} width={"100%"}/>
          <p style={{flex : 1,textAlign:"center",color : "#FF66CC"}}>{op}</p>
          <img src={"/sqr_bracket_right.png"} width={"100%"}/>
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
  projectTitleColor,
}: {
  emailname: string;
  data: Section[];
  headingColor?: string;
  projectTitleColor?: string;
}) => {
  const accent = headingColor || '#FF66CC';

  return (
    <div className="w-full max-w-[600px] bg-white p-4">
      <h1 className="text-[13px] font-bold mb-4" style={{ color: projectTitleColor || '#006937' }}>{emailname}</h1>
      <h2 className="text-[11px] font-bold mb-[18px]" style={{ color: accent }}>
        Variable Copy
      </h2>

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
