import React from 'react';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
const api=vi.hoisted(()=>({load:vi.fn(async()=>({status:'success',transactions:[]}))}));
vi.mock('../src/market.js',()=>({loadMarket:api.load,transactionsForParcel:()=>[],DVF_YEAR:2025}));
import {MarketSection} from '../src/MarketSection.jsx';
import {SourceDestination} from '../src/SourceNotes.jsx';
afterEach(cleanup);
it('loads transactions without a click and places source notes in the final source area',async()=>{
 const host=document.createElement('div');document.body.append(host);
 const {container,unmount}=render(<SourceDestination.Provider value={host}><MarketSection city={{code:'95127',nom:'Cergy'}}/></SourceDestination.Provider>);
 await waitFor(()=>expect(api.load).toHaveBeenCalled());await screen.findByText(/0 mutation/);
 expect(container.querySelector('details')).toBeNull();expect(container.textContent).not.toContain('Décompte sans doublons');expect(host.textContent).toContain('Décompte sans doublons');unmount();expect(host.textContent).toBe('');host.remove();
});
