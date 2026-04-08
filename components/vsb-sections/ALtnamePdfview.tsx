import React from 'react';

interface AltnameEntry {
  name: string;
  value: string;
}

interface Props {
  data: { images: AltnameEntry[], headingColor?: string } | AltnameEntry[];
  emailName?: string;
}

const ALtnamePdfview: React.FC<Props> = ({ data, emailName }) => {
  // Handle both { images: [...] } and direct array
  const images = Array.isArray(data) ? data : (data && Array.isArray(data.images) ? data.images : []);
  const headingColor = (!Array.isArray(data) && data?.headingColor) ? data.headingColor : '#006836';

  return (
    <div className="w-full bg-white p-6 font-sans text-black border">
      <div className="mb-3 pb-4">
        <h2 className="text-[18px] text-center font-bold" style={{ color: headingColor }}>ALT-Text for HTML version</h2>
      </div>

      <table className="w-full border-collapse border border-gray-300">

        <tbody>
          {images.length === 0 ? (
            <tr>
              <td colSpan={2} className="border border-gray-300 p-8 text-center text-gray-400 italic text-[12px]">
                No images selected for alt text.
              </td>
            </tr>
          ) : (
            images.map((img, idx) => (
              <tr key={idx} className="text-[12px]">
                <td className="border border-gray-300 p-3 w-[50%]">
                  <div className="flex justify-center items-center ">
                    {img.name ? (
                      <img
                        src={img.name}
                        alt="preview"
                        className=" max-h-[120px] object-contain  shadow-sm"
                      />
                    ) : (
                      <div className="w-[80px] h-[80px] bg-gray-50 border border-dashed flex items-center justify-center text-gray-300 text-[10px]">No Image</div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 p-4 align-center w-[50%]">

                  <div className="text-[13px] flex items-center text-black leading-relaxed  rounded  min-h-[60px]">
                    {img.value || <span className="text-gray-300 italic">No description provided</span>}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>


    </div>
  );
};

export default ALtnamePdfview;