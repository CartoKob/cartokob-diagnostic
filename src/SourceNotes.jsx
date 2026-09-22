import React,{createContext,useContext} from 'react';
import {createPortal} from 'react-dom';
export const SourceDestination=createContext(null);
export function SourceNotes({children}){const host=useContext(SourceDestination);return host?createPortal(<div className="source-note-group">{children}</div>,host):null;}
