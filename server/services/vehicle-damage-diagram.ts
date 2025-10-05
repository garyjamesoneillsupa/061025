// Professional vehicle damage diagram for POC/POD templates
export const VEHICLE_PANELS = [
  // Front area
  { id: 'windscreen', label: 'WINDSCREEN', x: 40, y: 20, width: 20, height: 15 },
  { id: 'bonnet', label: 'BONNET', x: 40, y: 35, width: 20, height: 20 },
  { id: 'front_bumper', label: 'FRONT BUMPER', x: 40, y: 55, width: 20, height: 8 },
  { id: 'grille', label: 'GRILLE', x: 45, y: 50, width: 10, height: 5 },
  
  // Driver side (N/S - Near Side)
  { id: 'ns_front_wing', label: 'N/S FRONT WING', x: 20, y: 45, width: 10, height: 15 },
  { id: 'ns_front_door', label: 'N/S FRONT DOOR', x: 20, y: 60, width: 10, height: 20 },
  { id: 'ns_rear_door', label: 'N/S REAR DOOR', x: 20, y: 80, width: 10, height: 20 },
  { id: 'ns_rear_wing', label: 'N/S REAR WING', x: 20, y: 100, width: 10, height: 15 },
  { id: 'ns_sill', label: 'N/S SILL', x: 20, y: 115, width: 10, height: 5 },
  { id: 'ns_mirror', label: 'N/S MIRROR', x: 18, y: 58, width: 4, height: 4 },
  
  // Passenger side (O/S - Off Side)
  { id: 'os_front_wing', label: 'O/S FRONT WING', x: 70, y: 45, width: 10, height: 15 },
  { id: 'os_front_door', label: 'O/S FRONT DOOR', x: 70, y: 60, width: 10, height: 20 },
  { id: 'os_rear_door', label: 'O/S REAR DOOR', x: 70, y: 80, width: 10, height: 20 },
  { id: 'os_rear_wing', label: 'O/S REAR WING', x: 70, y: 100, width: 10, height: 15 },
  { id: 'os_sill', label: 'O/S SILL', x: 70, y: 115, width: 10, height: 5 },
  { id: 'os_mirror', label: 'O/S MIRROR', x: 78, y: 58, width: 4, height: 4 },
  
  // Rear area
  { id: 'rear_windscreen', label: 'REAR WINDSCREEN', x: 40, y: 120, width: 20, height: 15 },
  { id: 'boot_tailgate', label: 'BOOT/TAILGATE', x: 40, y: 105, width: 20, height: 15 },
  { id: 'rear_bumper', label: 'REAR BUMPER', x: 40, y: 95, width: 20, height: 8 },
  
  // Roof
  { id: 'roof', label: 'ROOF', x: 40, y: 70, width: 20, height: 25 },
  
  // Wheels
  { id: 'ns_front_wheel', label: 'N/S FRONT WHEEL', x: 25, y: 50, width: 8, height: 8 },
  { id: 'ns_rear_wheel', label: 'N/S REAR WHEEL', x: 25, y: 105, width: 8, height: 8 },
  { id: 'os_front_wheel', label: 'O/S FRONT WHEEL', x: 67, y: 50, width: 8, height: 8 },
  { id: 'os_rear_wheel', label: 'O/S REAR WHEEL', x: 67, y: 105, width: 8, height: 8 },
  
  // Lights
  { id: 'ns_front_light', label: 'N/S FRONT LIGHT', x: 30, y: 45, width: 5, height: 5 },
  { id: 'os_front_light', label: 'O/S FRONT LIGHT', x: 65, y: 45, width: 5, height: 5 },
  { id: 'ns_rear_light', label: 'N/S REAR LIGHT', x: 30, y: 110, width: 5, height: 5 },
  { id: 'os_rear_light', label: 'O/S REAR LIGHT', x: 65, y: 110, width: 5, height: 5 }
];

// Damage types for professional reporting
export const DAMAGE_TYPES = [
  { id: 'scratch', label: 'Scratch', color: '#FFA500' },
  { id: 'dent', label: 'Dent', color: '#FF6347' },
  { id: 'chip', label: 'Chip', color: '#4169E1' },
  { id: 'crack', label: 'Crack', color: '#8B0000' },
  { id: 'scuff', label: 'Scuff', color: '#32CD32' },
  { id: 'rust', label: 'Rust', color: '#8B4513' },
  { id: 'missing', label: 'Missing', color: '#FF0000' },
  { id: 'broken', label: 'Broken', color: '#800080' },
  { id: 'other', label: 'Other', color: '#696969' }
];