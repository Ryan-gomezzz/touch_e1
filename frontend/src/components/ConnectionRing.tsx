import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getInitials, getHealthColor, COLORS } from '../theme';

interface Props {
  name: string;
  health: number;
  avatarColor: string;
  size?: number;
  onPress?: () => void;
  tag?: string;
}

export default function ConnectionRing({ name, health, avatarColor, size = 80, onPress, tag }: Props) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (health / 100) * circumference;
  const healthColor = getHealthColor(health);

  return (
    <TouchableOpacity
      testID={`connection-ring-${name.toLowerCase().replace(/\s/g, '-')}`}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { width: size + 12, alignItems: 'center' }]}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={healthColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[styles.avatar, { width: size - 16, height: size - 16, borderRadius: (size - 16) / 2, backgroundColor: avatarColor, top: 8, left: 8 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.25 }]}>{getInitials(name)}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      {tag && <Text style={styles.tag}>{tag}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 6, marginVertical: 8 },
  avatar: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
  name: { marginTop: 6, fontSize: 13, fontWeight: '600', color: '#2D3436', textAlign: 'center' },
  tag: { fontSize: 11, color: '#636E72', marginTop: 2 },
});
