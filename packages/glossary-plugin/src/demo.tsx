import * as React from "react";
import * as ReactDOM from "react-dom";
import GlossaryPopup from "./components/glossary-popup";

// tslint:disable-next-line:no-console
const newUserDefinition = (userDefinition: string) => { console.log("User definition:", userDefinition); };

// tslint:disable-next-line:max-line-length
const img = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Blausen_0328_EarAnatomy.png/500px-Blausen_0328_EarAnatomy.png";
const video = "https://upload.wikimedia.org/wikipedia/commons/e/e3/View_of_Cape_Town_from_Table_mountain_01.mp4";

ReactDOM.render(
  <GlossaryPopup
    word="eardrum"
    definition="An eardrum is a membrane, or thin piece of skin, stretched tight like a drum."
    imageUrl={img}
    imageCaption="Source: Wikipedia. This is a test caption. This is a test caption. This is a test caption."
    videoUrl={video}
    videoCaption="Source: Wikimedia. This video is unrelated to an eardrum. This is a test caption."
    userDefinitions={[]}
  />,
  document.getElementById("popup1") as HTMLElement
);

ReactDOM.render(
  <GlossaryPopup
    word="eardrum"
    definition="An eardrum is a membrane, or thin piece of skin, stretched tight like a drum."
    imageUrl={img}
    videoUrl={video}
    videoCaption="Source: Wikimedia. This video is unrelated to an eardrum. This is a test caption."
    userDefinitions={["I don't know"]}
    askForUserDefinition={true}
    onUserDefinitionsUpdate={newUserDefinition}
  />,
  document.getElementById("popup2") as HTMLElement
);