import * as THREE from 'three';
import { ObjectTransform3D } from '../types/scene';

export function applySceneTransform(group: THREE.Object3D, transform: ObjectTransform3D) {
  group.position.set(transform.x_mm / 1000, transform.z_mm / 1000, transform.y_mm / 1000);
  group.rotation.set(
    THREE.MathUtils.degToRad(transform.rotation_x_deg),
    THREE.MathUtils.degToRad(transform.rotation_z_deg),
    THREE.MathUtils.degToRad(transform.rotation_y_deg),
  );
  group.scale.set(transform.scale_x, transform.scale_z, transform.scale_y);
  return group;
}
