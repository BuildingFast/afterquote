/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Bounds, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { LoadStep } from "~/utils/StepLoader";
import CanvasLoader from "./Loader";

const StepModel: React.FC<ModelViewerProps> = ({ s3Url }) => {
  const [obj, setObj] = useState<any | null>(null);
  useEffect(() => {
    async function load() {
      const mainObject = await LoadStep(s3Url);
      setObj(mainObject);
    }
    void load();
  }, [s3Url]);

  if (!obj) {
    return null;
  }
  return <primitive object={obj} />;
};

interface ModelViewerProps {
  s3Url: string;
}

const STPModelViewer: React.FC<ModelViewerProps> = ({ s3Url }) => {
  const [, updateState] = useState<any | undefined>();
  useEffect(() => {
    // The function you want to call after 2 seconds
    const yourFunction = () => {
      updateState({});
    };

    const timer = setTimeout(yourFunction, 1500); // 1000ms = 1 second

    // Cleanup function: Clears the timeout if the component is unmounted before 2 seconds
    return () => {
      clearTimeout(timer);
    };
  }, [s3Url]);
  return (
    <div className="h-5/6 border">
      <Canvas frameloop="demand">
        <Suspense fallback={<CanvasLoader />}>
          <Bounds fit clip observe damping={6} margin={1.2}>
            <StepModel s3Url={s3Url} />
          </Bounds>
          <ambientLight intensity={0.5} />
          <pointLight intensity={0.5} position={[500, 500, 1000]} />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default STPModelViewer;
