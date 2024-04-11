import { Bounds, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense } from "react";
import { Mesh, MeshLambertMaterial } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import CanvasLoader from "./Loader";

interface STLModelViewerProps {
  modelUrl: string;
}

const STLModel: React.FC<STLModelViewerProps> = ({ modelUrl }) => {
  const geometry = useLoader(STLLoader, modelUrl);
  const mesh = new Mesh(geometry, new MeshLambertMaterial({ color: "white" }));
  return <primitive object={mesh} position={[0, 0, 0]} />;
};

const STLModelViewer: React.FC<STLModelViewerProps> = ({ modelUrl }) => {
  return (
    <div className="h-5/6 border">
      <Canvas
        shadows
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true }}
        // camera={{
        //   fov: 45,
        //   near: 0.1,
        //   far: 200,
        //   position: [-4, 3, 6],
        // }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <Bounds fit clip observe damping={6} margin={1.2}>
            <STLModel modelUrl={modelUrl} />
            <ambientLight intensity={0.25} />
            <pointLight intensity={0.75} position={[500, 500, 1000]} />
            <OrbitControls />
            {/* <OrthographicCamera
              makeDefault
              zoom={1}
              top={200}
              bottom={-200}
              left={200}
              right={-200}
              near={1}
              far={2000}
              position={[0, 0, 200]}
            /> */}
          </Bounds>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default STLModelViewer;
