import * as React from 'react';
import { ThemedText } from '../ThemedText';

describe('Admin ThemedText Component', () => {
  it('is a valid functional component', () => {
    expect(typeof ThemedText).toBe('function');
  });

  it('creates valid React element with props and children', () => {
    const element = React.createElement(ThemedText, { type: 'title' }, 'Admin Portal Test');
    expect(element.props.children).toBe('Admin Portal Test');
    expect(element.props.type).toBe('title');
  });
});
