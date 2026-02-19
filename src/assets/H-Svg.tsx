import { COLORS } from '../constants/Colors';
import { Path, Svg } from "react-native-svg";

export default function HSVG() {
  return (
    <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <Path
        d="M0 66.6334H17.7L21.0333 47.4334H29.9433L26.5667 66.6334H44.14L47.5967 47.4334H57.01L53.6767 66.6334H78.9567L73 56.7634L80 13.3667H62.8L59.51 32.19H49.9767L53.0967 13.3667H28.2767L34.0233 22.53L32.4 32.19H23.32L26.32 13.3667H1.16667L7.03333 22.6134L0 66.6334Z"
        fill={COLORS.AppTheme.primary}
      />
    </Svg>
  );
}
