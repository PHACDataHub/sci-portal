import React from 'react';
import { ResourcesComponent } from './ResourcesComponent';
import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';

describe('ResourcesComponent', () => {
  it('should render', async () => {
    await renderInTestApp(<ResourcesComponent />);
    expect(screen.getByText('Resources!')).toBeInTheDocument();
  });
});
