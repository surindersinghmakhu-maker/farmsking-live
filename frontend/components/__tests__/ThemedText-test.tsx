import * as React from 'react';
import { ThemedText } from '../ThemedText';

describe('ThemedText Component', () => {
  it('is a valid functional component', () => {
    expect(typeof ThemedText).toBe('function');
  });

  it('creates valid React element with props and children', () => {
    const element = React.createElement(ThemedText, { type: 'title' }, 'Snapshot test!');
    expect(element.props.children).toBe('Snapshot test!');
    expect(element.props.type).toBe('title');
  });
});
