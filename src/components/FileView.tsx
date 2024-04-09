import React, { type FC } from "react";
import dynamic from "next/dynamic";
import STLModelViewer from "./STLModelViewer";
import ExcelFileViewer from "./ExcelFileViewer";

const STPModelViewer = dynamic(() => import("./STPModelViewer"), {
  ssr: false,
});

const ReactViewer = dynamic(() => import("react-viewer"), { ssr: false });

interface FileViewerProps {
  viewerUrl: string;
}

export const FileViewer: FC<FileViewerProps> = ({ viewerUrl }) => {
  const [visible, setVisible] = React.useState(false);
  const isSTL = viewerUrl.toLowerCase().includes(".stl");
  const isSTP =
    viewerUrl.toLowerCase().includes(".stp") ||
    viewerUrl.toLowerCase().includes(".step");
  const isExcel =
    viewerUrl.toLowerCase().includes(".xls") ||
    viewerUrl.toLowerCase().includes(".xlsx") ||
    viewerUrl.toLowerCase().includes(".csv");
  const isPhoto =
    viewerUrl.toLowerCase().includes(".jpeg") ||
    viewerUrl.toLowerCase().includes(".jpg") ||
    viewerUrl.toLowerCase().includes(".png");

  if (isSTL) {
    return <STLModelViewer modelUrl={viewerUrl} />;
  } else if (isSTP) {
    return <STPModelViewer s3Url={viewerUrl ?? ""} />;
  } else if (isExcel) {
    return <ExcelFileViewer fileUrl={viewerUrl ?? ""} />;
  } else if (isPhoto) {
    return (
      <div>
        <img
          src={viewerUrl}
          alt="Image Preview"
          onClick={() => {
            setVisible(true);
          }}
        />
        <ReactViewer
          visible={visible}
          onClose={() => {
            setVisible(false);
          }}
          images={[{ src: viewerUrl }]}
        />
      </div>
    );
  } else {
    return (
      <iframe
        src={viewerUrl}
        title="File Preview"
        className="h-screen w-full "
        height={500}
      />
    );
  }
};

export default FileViewer;
