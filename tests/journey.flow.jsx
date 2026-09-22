import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const api=vi.hoisted(()=>({getJson:vi.fn()}));
vi.mock('../src/diagnostic.js',()=>({getJson:api.getJson}));
vi.mock('../src/MapView.jsx',()=>({MapView:({onPoint,city})=><div><button onClick={()=>onPoint({lat:45.75,lng:4.83})}>Point Lyon</button><button onClick={()=>onPoint({lat:49.03,lng:2.06})}>Point Cergy</button><span data-testid="map-city">{city?.nom||'France'}</span></div>}));
vi.mock('../src/CommunePortrait.jsx',()=>({CommunePortrait:({city})=><div data-testid="commune-report">Portrait de {city.nom}</div>}));
vi.mock('../src/Diagnostic.jsx',()=>({Diagnostic:({city,point})=><div data-testid="parcel-report">Parcelle à {city.nom} : {point.lat},{point.lon}</div>}));
vi.mock('../src/SearchBox.jsx',()=>({SearchBox:({onSelect})=><button onClick={()=>onSelect({address:true,nom:'Adresse précise',lat:45.75,lon:4.83})}>Adresse directe</button>}));
import {App} from '../src/App.jsx';
const communes=[{code:'69123',nom:'Lyon',codeDepartement:'69',departement:{nom:'Rhône'},region:{nom:'Auvergne-Rhône-Alpes'},population:519127,surface:4797,centre:{coordinates:[4.83,45.75]},codesPostaux:['69002']},{code:'95127',nom:'Cergy',codeDepartement:'95',departement:{nom:'Val-d’Oise'},region:{nom:'Île-de-France'},population:67000,surface:1200,centre:{coordinates:[2.06,49.03]},codesPostaux:['95000']}];
beforeEach(()=>{history.replaceState({},'','/');api.getJson.mockReset();api.getJson.mockImplementation(async url=>url==='/communes.json'?communes:[{code:url.includes('lat=49.03')?'95127':'69123'}]);});
afterEach(cleanup);
describe('commune then parcel journey',()=>{
 it('opens commune automatically, then parcel at the exact second click, then a new commune',async()=>{
  render(<App/>);await waitFor(()=>expect(screen.queryByText(/Chargement des communes/)).toBeNull());
  await waitFor(()=>expect(api.getJson).toHaveBeenCalledWith('/communes.json',expect.anything()));
  fireEvent.click(screen.getByText('Point Lyon'));
  await screen.findByText('Portrait de Lyon');expect(screen.queryByTestId('parcel-report')).toBeNull();
  fireEvent.click(screen.getByText('Point Lyon'));
  expect((await screen.findByTestId('parcel-report')).textContent).toContain('45.75,4.83');
  fireEvent.click(screen.getByText('Point Cergy'));
  await screen.findByText('Portrait de Cergy');expect(screen.queryByTestId('parcel-report')).toBeNull();
 });
 it('address search enters parcel view directly',async()=>{
  render(<App/>);await waitFor(()=>expect(api.getJson).toHaveBeenCalled());await new Promise(r=>setTimeout(r,0));
  fireEvent.click(screen.getByText('Adresse directe'));
  expect((await screen.findByTestId('parcel-report')).textContent).toContain('Parcelle à Lyon');
 });
 it('ignores a late response after a newer map selection',async()=>{
  let resolveOld;api.getJson.mockImplementation(url=>url==='/communes.json'?Promise.resolve(communes):url.includes('lat=45.75')?new Promise(resolve=>{resolveOld=resolve;}):Promise.resolve([{code:'95127'}]));
  render(<App/>);await new Promise(r=>setTimeout(r,0));
  fireEvent.click(screen.getByText('Point Lyon'));fireEvent.click(screen.getByText('Point Cergy'));
  await screen.findByText('Portrait de Cergy');resolveOld([{code:'69123'}]);
  await new Promise(r=>setTimeout(r,0));expect(screen.getByTestId('map-city').textContent).toBe('Cergy');
 });
 it('outside coverage does not attribute a commune',async()=>{
  api.getJson.mockImplementation(async url=>url==='/communes.json'?communes:[]);render(<App/>);await new Promise(r=>setTimeout(r,0));fireEvent.click(screen.getByText('Point Lyon'));
  await screen.findByText('Choisissez un lieu situé en France métropolitaine.');expect(screen.queryByTestId('commune-report')).toBeNull();
 });
});
