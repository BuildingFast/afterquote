/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as THREE from "three";
import * as occtImportJs from "occt-import-js";
export async function LoadStep(fileUrl: RequestInfo | URL) {
  const occt = await occtImportJs();

  const targetObject = new THREE.Object3D();

  // download a step file
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();

  // read the imported step file
  const fileBuffer = new Uint8Array(buffer);
  const result = occt.ReadStepFile(fileBuffer, null);

  // process the geometries of the result
  for (const resultMesh of result.meshes) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );
    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }
    const index = Uint32Array.from(resultMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    let material = null;
    if (resultMesh.color) {
      const color = new THREE.Color(
        resultMesh.color[0],
        resultMesh.color[1],
        resultMesh.color[2]
      );
      material = new THREE.MeshLambertMaterial({ color: color });
    }

    if (resultMesh.face_colors) {
      material = new THREE.MeshLambertMaterial({
        vertexColors: true,
      });

      geometry = geometry.toNonIndexed();
      const faceColors = new Array(
        geometry.attributes.position?.array.length
      ).fill(0);
      for (const faceColorGroup of resultMesh.face_colors) {
        const { color, first, last } = faceColorGroup;
        for (let i = first; i <= last; i++) {
          faceColors.splice(Math.floor(i * 9), 9, ...color, ...color, ...color);
        }
      }
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(faceColors, 3)
      );
    }

    if (!material) {
      material = new THREE.MeshLambertMaterial({ color: "#FFFFFF" });
    }

    const mesh = new THREE.Mesh(geometry, material);
    targetObject.add(mesh);
  }
  return targetObject;
}
