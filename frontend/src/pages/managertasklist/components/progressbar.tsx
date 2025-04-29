import React from 'react';
import { Flex, Text } from '@radix-ui/themes';

interface ProgressBarProps {
  percent: number;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percent, 
  showText = true,
  size = 'medium'
}) => {
  // กำหนดความสูงตาม size
  const getHeight = () => {
    switch(size) {
      case 'small': return '0.5rem';
      case 'large': return '1rem';
      default: return '0.75rem';
    }
  };

  // กำหนดสีตามเปอร์เซ็นต์
  const getColor = () => {
    if (percent < 25) return '#ef4444'; // สีแดง
    if (percent < 50) return '#f97316'; // สีส้ม
    if (percent < 75) return '#facc15'; // สีเหลือง
    return '#22c55e'; // สีเขียว
  };

  return (
    <Flex direction="column" gap="1">
      {showText && (
        <Text size="1" weight="medium">
          {percent}% Complete
        </Text>
      )}
      <div 
        style={{ 
          width: '100%', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '9999px', 
          height: getHeight(),
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            width: `${percent}%`, 
            backgroundColor: getColor(), 
            height: '100%', 
            borderRadius: '9999px',
            transition: 'width 0.5s ease-in-out'
          }} 
        />
      </div>
    </Flex>
  );
};

export default ProgressBar;