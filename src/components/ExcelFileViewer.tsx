/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect } from "react";
import { read, utils, type WorkSheet } from "xlsx";
import Spreadsheet from "react-spreadsheet";

interface ExcelFileViewerProps {
  fileUrl: string;
}

const ExcelFileViewer: React.FC<ExcelFileViewerProps> = ({ fileUrl }) => {
  const [jsonObject, setJsonObject] = useState<any | null>(null);
  const [currentSheet, setCurrentSheet] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    void (async () => {
      console.log("fileURL", fileUrl);
      const f = await (await fetch(fileUrl)).arrayBuffer();
      const wb = read(f);
      setCurrentSheet(wb.SheetNames[0]);
      // set the data row by row just the cell values (as shown in the format array above) for each sheet
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName] as WorkSheet;

        const data = utils.sheet_to_json(ws, { header: 1 });
        const formattedData = data.map((row: any) =>
          Object.values(row).map((cellValue) => ({ value: cellValue }))
        );
        const maxColSize = Math.max(...formattedData.map((row) => row.length));
        formattedData.forEach((row) => {
          while (row.length < maxColSize) {
            row.push({ value: "" });
          }
        });
        console.log("formattedData", formattedData);

        setJsonObject((prev: any) => ({ ...prev, [sheetName]: formattedData }));
      }
    })();
  }, [setJsonObject, fileUrl, setCurrentSheet]);

  return (
    <div className="h-full w-full">
      <div className="">
        {currentSheet && jsonObject ? (
          <Spreadsheet
            data={jsonObject[currentSheet]}
            className="pointer-events-none"
          />
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <div className="flex">
        {jsonObject &&
          Object.keys(jsonObject).map((sheetName) => (
            <button
              key={sheetName}
              className={`rounded-b-md px-3 py-2 ${
                currentSheet === sheetName
                  ? "bg-gray-100"
                  : "bg-white text-gray-500"
              }`}
              onClick={() => setCurrentSheet(sheetName)}
            >
              {sheetName}
            </button>
          ))}
      </div>
    </div>
  );
};

export default ExcelFileViewer;
