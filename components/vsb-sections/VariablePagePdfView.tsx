"use client"

interface Pdfprops {
  heading: string;
  options: string[];
}

const VariablePagePdfView = ({ emailname, data }: { emailname: string, data: Pdfprops[] }) => {
  return (
    <div className='w-full max-w-[600px] bg-white p-4'>
      <h1 className='text-[13px] text-[#006937] font-bold mb-2'>{emailname}</h1>
      <h3 className='text-[11px] text-[#FF66CC] font-bold mb-3'>Variable copy</h3>

      {/* content hear */}
      {data?.map((item, index) => (
        <div key={index} className='mb-4'>
          <h2 className='text-[11px] text-[#FF66CC] font-bold mb-1'>[{item.heading}]</h2>
          {Array.isArray(item.options) ? item.options.map((contentItem, contentIndex) => {
            const isImage = typeof contentItem === 'string' && (contentItem.startsWith('data:image') || contentItem.startsWith('http'));

            return (
              <div key={contentIndex} className='text-[10px] text-[#000000] mb-2'>
                <span style={{ "fontWeight": "bold", marginRight: "2px" }}>Option {contentIndex + 1} : </span>
                {isImage ? (
                  <img
                    src={contentItem}
                    alt={`Option ${contentIndex + 1}`}
                    className="mt-1 border border-gray-100 rounded"
                    style={{ maxHeight: '120px', maxWidth: '100%', display: 'inline-block' }}
                  />
                ) : (
                  <span>{contentItem}</span>
                )}
              </div>
            );
          }) : null}
        </div>
      ))}
    </div>
  )
}


export default VariablePagePdfView
