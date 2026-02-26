declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class MaterialCommunityIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class MaterialIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class FontAwesome extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Ionicons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Feather extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome6' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class FontAwesome6 extends Component<IconProps> {}
}
