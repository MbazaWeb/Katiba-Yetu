import React from 'react';
import { View, Text, Image } from 'react-native';
import { Colors, Typography, Radius } from '../../constants/tokens';
import { getInitials } from '../../utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarType = 'user' | 'org' | 'anon';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  type?: AvatarType;
  size?: AvatarSize;
  verified?: boolean;
  orgType?: 'law_society' | 'ngo' | 'academic' | 'taasisi' | 'idara';
}

const sizeMap: Record<AvatarSize, { dim: number; fontSize: number }> = {
  xs: { dim: 24, fontSize: 9  },
  sm: { dim: 32, fontSize: 11 },
  md: { dim: 40, fontSize: 14 },
  lg: { dim: 52, fontSize: 18 },
  xl: { dim: 68, fontSize: 24 },
};

const orgColors: Record<string, { bg: string; text: string }> = {
  law_society: { bg: Colors.blue[900],  text: Colors.blue[200]  },
  ngo:         { bg: Colors.green[900], text: Colors.green[200] },
  academic:    { bg: '#2A1A3A',         text: '#C0A0E8'         },
  taasisi:     { bg: Colors.gold[900],  text: Colors.gold[200]  },
  idara:       { bg: '#1A1A2A',         text: '#8090D0'         },
};

const userColors = [
  { bg: Colors.green[900],  text: Colors.green[300] },
  { bg: Colors.blue[900],   text: Colors.blue[300]  },
  { bg: Colors.gold[900],   text: Colors.gold[300]  },
  { bg: '#2A1A3A',          text: '#C0A0E8'         },
  { bg: '#2A1A0A',          text: '#E0A070'         },
];

function getColorForName(name: string): { bg: string; text: string } {
  // Guard against NaN for empty/short names — fall back to index 0
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  const idx = Number.isFinite(code) && code > 0
    ? code % userColors.length
    : 0;
  return userColors[idx] ?? userColors[0];
}

export function Avatar({
  name = '',
  imageUrl,
  type = 'user',
  size = 'md',
  verified = false,
  orgType,
}: AvatarProps) {
  const sc = sizeMap[size];
  const initials = type === 'anon' ? '??' : getInitials(name || '??');

  let colors: { bg: string; text: string };
  if (type === 'org' && orgType) {
    colors = orgColors[orgType] ?? orgColors.taasisi;
  } else if (type === 'anon') {
    colors = { bg: Colors.surface.overlay, text: Colors.text.muted };
  } else {
    colors = getColorForName(name);
  }

  const dotSize = Math.max(8, Math.round(sc.dim * 0.25));

  return (
    <View style={{ position: 'relative', width: sc.dim, height: sc.dim }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: sc.dim,
            height: sc.dim,
            borderRadius: type === 'org' ? Radius.lg : Radius.full,
          }}
        />
      ) : (
        <View
          style={{
            width: sc.dim,
            height: sc.dim,
            borderRadius: type === 'org' ? Radius.lg : Radius.full,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: Colors.surface.border,
          }}
        >
          <Text
            style={{
              fontFamily: Typography.family.sans,
              fontSize: sc.fontSize,
              fontWeight: Typography.weight.semibold,
              color: colors.text,
            }}
          >
            {initials}
          </Text>
        </View>
      )}
      {verified && (
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: dotSize,
            height: dotSize,
            borderRadius: Radius.full,
            backgroundColor: Colors.green[500],
            borderWidth: 1.5,
            borderColor: Colors.surface.base,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      )}
    </View>
  );
}

export default Avatar;
