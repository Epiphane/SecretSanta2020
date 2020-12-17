// import {
//   BufferGeometry,
//   FileLoader,
//   Float32BufferAttribute,
//   Group,
//   LineBasicMaterial,
//   LineSegments,
//   Loader,
//   Material,
//   Mesh,
//   MeshPhongMaterial,
//   Points,
//   PointsMaterial,
//   Vector3,
// } from "./three.js";

// // o object_name | g group_name
// var object_pattern = /^[og]\s*(.+)?/;
// // mtllib file_reference
// var material_library_pattern = /^mtllib /;
// // usemtl material_name
// var material_use_pattern = /^usemtl /;
// // usemap map_name
// var map_use_pattern = /^usemap /;

// var vA = new Vector3();
// var vB = new Vector3();
// var vC = new Vector3();

// var ab = new Vector3();
// var cb = new Vector3();

// interface GeometryInfo {
//   vertices: number[];
//   normals: number[];
//   colors: number[];
//   uvs: number[];
//   hasUVIndices: boolean;
// }

// interface MaterialInfo {
//   index: number;
//   name: string;
//   mtllib: string;
//   smooth: boolean;
//   groupStart: number;
//   groupEnd: number;
//   groupCount: number;
//   inherited: boolean;
// }

// // class Material implements MaterialInfo {
// //   index: number;
// //   name: string;
// //   mtllib: string;
// //   smooth: boolean;
// //   groupStart: number;
// //   groupEnd: number;
// //   groupCount: number;
// //   inherited: boolean;

// //   clone(index: number) {

// //       var cloned = {
// //           index: (typeof index === 'number' ? index : this.index),
// //           name: this.name,
// //           mtllib: this.mtllib,
// //           smooth: this.smooth,
// //           groupStart: 0,
// //           groupEnd: - 1,
// //           groupCount: - 1,
// //           inherited: false
// //       };
// //       cloned.clone = this.clone.bind(cloned);
// //       return cloned;

// //   }
// // }

// class Object {
//   name: string;
//   fromDeclaration: boolean;

//   geometry: GeometryInfo;
//   materials: Material[];
//   smooth: boolean;

//   startMaterial(name: string, libraries: string[]) {

//     var previous = this._finalize(false);

//     // New usemtl declaration overwrites an inherited material, except if faces were declared
//     // after the material, then it must be preserved for proper MultiMaterial continuation.
//     if (previous && (previous.inherited || previous.groupCount <= 0)) {

//       this.materials.splice(previous.index, 1);

//     }

//     var material = {
//       index: this.materials.length,
//       name: name || '',
//       mtllib: (Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : ''),
//       smooth: (previous !== undefined ? previous.smooth : this.smooth),
//       groupStart: (previous !== undefined ? previous.groupEnd : 0),
//       groupEnd: - 1,
//       groupCount: - 1,
//       inherited: false,
//     };

//     this.materials.push(material);

//     return material;

//   },

//   currentMaterial() {

//     if (this.materials.length > 0) {

//       return this.materials[this.materials.length - 1];

//     }

//     return undefined;

//   },

//   _finalize(end) {

//     var lastMultiMaterial = this.currentMaterial();
//     if (lastMultiMaterial && lastMultiMaterial.groupEnd === - 1) {

//       lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
//       lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
//       lastMultiMaterial.inherited = false;

//     }

//     // Ignore objects tail materials if no face declarations followed them before a new o/g started.
//     if (end && this.materials.length > 1) {

//       for (var mi = this.materials.length - 1; mi >= 0; mi--) {

//         if (this.materials[mi].groupCount <= 0) {

//           this.materials.splice(mi, 1);

//         }

//       }

//     }

//     // Guarantee at least one empty material, this makes the creation later more straight forward.
//     if (end && this.materials.length === 0) {

//       this.materials.push({
//         name: '',
//         smooth: this.smooth
//       });

//     }

//     return lastMultiMaterial;

//   }
// }

// interface ObjectInfo {
//   name: string;
//   fromDeclaration: boolean;
//   geometry: GeometryInfo;
//   materials: string[];
//   smooth: boolean;

//   currentMaterial: () => any;
//   startMaterial: (name: string, libraries: string[]) => void;
//   _finalize: (end: boolean) => any;
// }

// class ParserState {
//   objects: ObjectInfo[] = [];
//   object: ObjectInfo | undefined;

//   vertices: number[] = [];
//   normals: number[] = [];
//   colors: number[] = [];
//   uvs: number[] = [];

//   materials: { [key: string]: MaterialInfo } = {};
//   materialLibraries: string[] = [];

//   startObject(name: string, fromDeclaration: boolean) {
//     // If the current object (initial from reset) is not from a g/o declaration in the parsed
//     // file. We need to use it for the first parsed g/o to keep things in sync.
//     if (this.object && this.object.fromDeclaration === false) {
//       this.object.name = name;
//       this.object.fromDeclaration = (fromDeclaration !== false);
//       return;
//     }

//     var previousMaterial = this.object?.currentMaterial();
//     if (this.object && typeof this.object._finalize === 'function') {
//       this.object._finalize(true);
//     }

//     this.object = {
//       name: name || '',
//       fromDeclaration: (fromDeclaration !== false),

//       geometry: {
//         vertices: [],
//         normals: [],
//         colors: [],
//         uvs: [],
//         hasUVIndices: false
//       },
//       materials: [],
//       smooth: true,

//       startMaterial: function (name, libraries) {
//         var previous = this._finalize(false);

//         // New usemtl declaration overwrites an inherited material, except if faces were declared
//         // after the material, then it must be preserved for proper MultiMaterial continuation.
//         if (previous && (previous.inherited || previous.groupCount <= 0)) {

//           this.materials.splice(previous.index, 1);

//         }

//         var material = {
//           index: this.materials.length,
//           name: name || '',
//           mtllib: (Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : ''),
//           smooth: (previous !== undefined ? previous.smooth : this.smooth),
//           groupStart: (previous !== undefined ? previous.groupEnd : 0),
//           groupEnd: -1,
//           groupCount: -1,
//           inherited: false,

//           clone: function (index?: number) {

//             var cloned = {
//               index: index || this.index,
//               name: this.name,
//               mtllib: this.mtllib,
//               smooth: this.smooth,
//               groupStart: 0,
//               groupEnd: -1,
//               groupCount: -1,
//               inherited: false
//             } as Partial<ObjectInfo>;
//             cloned.clone = this.clone.bind(cloned);
//             return cloned;

//           }
//         };

//         this.materials.push(material);

//         return material;

//       },

//       currentMaterial: function () {

//         if (this.materials.length > 0) {

//           return this.materials[this.materials.length - 1];

//         }

//         return undefined;

//       },

//       _finalize: function (end) {

//         var lastMultiMaterial = this.currentMaterial();
//         if (lastMultiMaterial && lastMultiMaterial.groupEnd === - 1) {

//           lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
//           lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
//           lastMultiMaterial.inherited = false;

//         }

//         // Ignore objects tail materials if no face declarations followed them before a new o/g started.
//         if (end && this.materials.length > 1) {

//           for (var mi = this.materials.length - 1; mi >= 0; mi--) {

//             if (this.materials[mi].groupCount <= 0) {

//               this.materials.splice(mi, 1);

//             }

//           }

//         }

//         // Guarantee at least one empty material, this makes the creation later more straight forward.
//         if (end && this.materials.length === 0) {

//           this.materials.push({
//             name: '',
//             smooth: this.smooth
//           });

//         }

//         return lastMultiMaterial;

//       }
//     };

//     // Inherit previous objects material.
//     // Spec tells us that a declared material must be set to all objects until a new material is declared.
//     // If a usemtl declaration is encountered while this new object is being parsed, it will
//     // overwrite the inherited material. Exception being that there was already face declarations
//     // to the inherited material, then it will be preserved for proper MultiMaterial continuation.

//     if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {

//       var declared = previousMaterial.clone(0);
//       declared.inherited = true;
//       this.object.materials.push(declared);

//     }

//     this.objects.push(this.object);

//   }
// }
