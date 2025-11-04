declare module 'react-native-maps' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps extends ViewProps {
    provider?: 'google' | null;
    region?: Region;
    initialRegion?: Region;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    pitchEnabled?: boolean;
    rotateEnabled?: boolean;
    showsUserLocation?: boolean;
    followsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    showsPointsOfInterest?: boolean;
    showsCompass?: boolean;
    showsScale?: boolean;
    showsTraffic?: boolean;
    showsBuildings?: boolean;
    showsIndoors?: boolean;
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
    customMapStyle?: any[];
  }

  export interface MarkerProps extends ViewProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    onPress?: () => void;
    onSelect?: () => void;
    onDeselect?: () => void;
    onCalloutPress?: () => void;
    draggable?: boolean;
    onDragStart?: (event: any) => void;
    onDrag?: (event: any) => void;
    onDragEnd?: (event: any) => void;
  }

  export default class MapView extends Component<MapViewProps> {}
  export class Marker extends Component<MarkerProps> {}
  
  export const PROVIDER_GOOGLE: 'google';
  export const PROVIDER_DEFAULT: null;
}
