import React from 'react';

interface TitleCardProps {
  title: string;
  subtitle?: string;
}

const TitleCard: React.FC<TitleCardProps> = ({ title, subtitle }) => {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: '10px'
      }}>{title}</h1>
      {subtitle && (
        <p style={{
          fontSize: '1.2rem',
          color: '#666666'
        }}>{subtitle}</p>
      )}
    </div>
  );
};

export default TitleCard;