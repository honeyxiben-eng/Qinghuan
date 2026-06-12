'use client'
import{useState,useEffect}from'react'
export function useFavorites(key:string){
  const[ids,setIds]=useState<Set<string>>(new Set())
  useEffect(()=>{try{const s=localStorage.getItem('sl-fav-'+key);if(s)setIds(new Set(JSON.parse(s)))}catch{}},[key])
  const toggle=(id:string)=>{const n=new Set(ids);n.has(id)?n.delete(id):n.add(id);setIds(n);localStorage.setItem('sl-fav-'+key,JSON.stringify([...n]))}
  const clear=()=>{setIds(new Set());localStorage.removeItem('sl-fav-'+key)}
  return{ids,toggle,clear,has:(id:string)=>ids.has(id)}
}
