import * as React from "react";
import * as ReactDOM from "react-dom";
import PluginApp from "./components/plugin/plugin-app";
import "whatwg-fetch"; // window.fetch polyfill for older browsers (IE)
import * as PluginAPI from "@concord-consortium/lara-plugin-api";
import { FIREBASE_APP, signInWithToken } from "./db";
import AuthoringApp, { IGlossaryAuthoredState } from "./components/authoring/authoring-app";
import { IGlossary } from "./types";
import { IJwtClaims } from "@concord-consortium/lara-plugin-api";
import { parseUrl } from "./utils/get-url-param";

const getGlossaryInfo = (context: PluginAPI.IPluginRuntimeContext) => {
  const defaultState: IGlossaryAuthoredState = {
    version: "1.0",
    glossaryResourceId: null,
    s3Url: null
  };
  if (!context.authoredState) {
    return defaultState;
  }
  try {
    return JSON.parse(context.authoredState) as IGlossaryAuthoredState;
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.warn("Unexpected authoredState:", context.authoredState);
    return defaultState;
  }
};

const getGlossaryDefinition = async (authoredState: IGlossaryAuthoredState) => {
  if (typeof authoredState.s3Url === "string") {
    const response = await fetch(authoredState.s3Url);
    try {
      const textResponse = await response.text();
      return JSON.parse(textResponse);
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.warn("Unexpected/malformed authoredState at URL:", authoredState.s3Url);
      return {};
    }
  }
  return {};
};

const getLearnerState = (context: PluginAPI.IPluginRuntimeContext) => {
  const fallbackLearnerState = { definitions: {} };
  if (!context.learnerState) {
    return fallbackLearnerState;
  }
  try {
    return JSON.parse(context.learnerState);
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.warn("Unexpected learnerState:", context.learnerState);
    return fallbackLearnerState;
  }
};

export class GlossaryPlugin {
  public context: PluginAPI.IPluginRuntimeContext;
  public pluginAppComponent: any;

  constructor(context: PluginAPI.IPluginRuntimeContext) {
    this.context = context;
    // Note renderPluginApp is an async function. Constructor can't be async, as it needs to return immediately.
    // It also means that component won't be rendered immediately. That's fine.
    this.renderPluginApp();
  }

  // This method is public so tests can call it directly and wait for it to finish.
  // Note that in such case it will be called twice - by constructor and by test code directly.
  // It needs to be idempotent.
  public renderPluginApp = async () => {
    const glossaryInfo = getGlossaryInfo(this.context);
    const authoredState: IGlossary = await getGlossaryDefinition(glossaryInfo);

    if (this.pluginAppComponent) {
      ReactDOM.unmountComponentAtNode(this.context.container);
      this.pluginAppComponent = undefined;
    }

    let studentInfo;
    if (this.context.remoteEndpoint) {
      // If there's no remote endpoint, there's no connection to Portal and JWT cannot be obtained.
      // Errors are handled anyway, but we can avoid displaying 500 error in browser console.
      try {
        const firebaseJwt = await this.context.getFirebaseJwt(FIREBASE_APP);
        await signInWithToken(firebaseJwt.token);
        studentInfo = {
          // Types in LARA Plugin API should be fixed.
          source: parseUrl((firebaseJwt.claims as IJwtClaims).domain).hostname,
          contextId: (firebaseJwt.claims as IJwtClaims).claims.class_hash,
          userId: (firebaseJwt.claims as any).claims.platform_user_id.toString()
        };
      } catch (e) {
        // getFirebaseJwt will throw an exception when run doesn't have remote endpoint, so when user
        // hasn't launched an activity from Portal. In this case just do nothing special.
        // studentInfo will be undefined and PluginApp won't try to connect to Firestore.
      }
    }

    this.pluginAppComponent = ReactDOM.render(
      <PluginApp
        saveState={this.context.saveLearnerPluginState}
        initialLearnerState={getLearnerState(this.context)}
        definitions={authoredState.definitions || []}
        askForUserDefinition={authoredState.askForUserDefinition || false}
        autoShowMediaInPopup={authoredState.autoShowMediaInPopup || false}
        enableStudentRecording={authoredState.enableStudentRecording || false}
        translations={authoredState.translations || {}}
        showSideBar={authoredState.showSideBar || false}
        studentInfo={studentInfo}
        glossaryInfo={glossaryInfo}
        resourceUrl={this.context.resourceUrl}
        laraLog={this.context.log}
      />,
      // It can be any other element in the document. Note that PluginApp render everything using React Portals.
      // It renders child components into external containers sent to LARA, not into context.div
      // or anything else that we provide here.
      this.context.container);
  }
}

export class GlossaryAuthoringPlugin {
  public context: PluginAPI.IPluginAuthoringContext;
  public pluginAppComponent: any;

  constructor(context: PluginAPI.IPluginAuthoringContext) {
    this.context = context;
    this.renderPluginApp();
  }

  // This method is public so tests can call it directly and wait for it to finish.
  // Note that in such case it will be called twice - by constructor and by test code directly.
  // It needs to be idempotent.
  public renderPluginApp = () => {
    const authoredState: IGlossaryAuthoredState =
      this.context.authoredState ? JSON.parse(this.context.authoredState) : {};

    this.pluginAppComponent = ReactDOM.render(
      <AuthoringApp
        inlineAuthoring={{
          authoredState,
          saveAuthoredPluginState: this.context.saveAuthoredPluginState,
        }}
        getFirebaseJwt={this.context.getFirebaseJwt}
      />,
      this.context.container);
  }
}

export const initPlugin = () => {
  if (!PluginAPI || !PluginAPI.registerPlugin) {
    // tslint:disable-next-line:no-console
    console.warn("LARA Plugin API not available, GlossaryPlugin terminating");
    return;
  }
  // tslint:disable-next-line:no-console
  console.log("LARA Plugin API available, GlossaryPlugin initialization");
  PluginAPI.registerPlugin({
    runtimeClass: GlossaryPlugin,
    authoringClass: GlossaryAuthoringPlugin
  });
};

initPlugin();
