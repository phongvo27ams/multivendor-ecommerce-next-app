"use client"

import StoreProvider from "./StoreProvider";
import Banner from "../components/Banner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TestPage() {
  return (
    <StoreProvider>
      <div style={{ padding: 24 }}>
        <h1>Alias resolution test</h1>
        <p>StoreProvider type: {typeof StoreProvider}</p>
        <p>Banner type: {typeof Banner}</p>
        <p>Navbar type: {typeof Navbar}</p>
        <p>Footer type: {typeof Footer}</p>
        <p>Open the dev console / terminal to see compiler output.</p>
      </div>
    </StoreProvider>
  );
}