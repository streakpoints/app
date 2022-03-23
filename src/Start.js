import React from 'react';
import PageHeader from './PageHeader';

function Start() {
  return (
    <div>
      <PageHeader handle='x' />
      <h2 style={{ display: 'flex', alignItems: 'center' }}>
        Welcome to 721.am
      </h2>
    </div>
  );
}

export default Start;
