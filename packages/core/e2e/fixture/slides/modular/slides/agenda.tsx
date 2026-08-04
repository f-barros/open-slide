import type { Page } from '@comp-slide/core';
import { fill } from '../components/theme';

export const Agenda: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Modular agenda</h1>
    <p style={{ fontSize: 40 }}>Second page in declared order</p>
  </div>
);
