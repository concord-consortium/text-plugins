import * as React from "react";
import Definition from "./definition";
import { IWordDefinition, ILearnerDefinitions } from "./types";

import * as css from "./glossary-sidebar.scss";

enum Filter {
  AllWords,
  WithUserDefinitionOnly
}

const nonEmptyHash = (hash: any) => {
  return Object.keys(hash).length > 0;
};

interface IProps {
  definitions: IWordDefinition[];
  learnerDefinitions: ILearnerDefinitions;
}

interface IState {
  filter: Filter;
}

export default class GlossarySidebar extends React.Component<IProps, IState> {
  public state: IState = {
    // Show words that have user definition by default. Note that this filter will be ignored if user hasn't defined
    // anything yet.
    filter: Filter.WithUserDefinitionOnly
  };

  public render() {
    const { definitions, learnerDefinitions } = this.props;
    const { filter } = this.state;
    const wordsIHaveDefinedClass = css.toggle
      + (filter === Filter.WithUserDefinitionOnly ? " " + css.activeToggle : "");
    const allWordsClass = css.toggle + (filter === Filter.AllWords ? " " + css.activeToggle : "");
    return (
      <div>
        {
          // Show toggles only if there's anything to toggle between.
          nonEmptyHash(learnerDefinitions) &&
          <div>
            <div className={css.toggles}>
              <div className={wordsIHaveDefinedClass} onClick={this.ownWordsClicked}>Words I Have Defined</div>
              <div className={allWordsClass} data-cy="all-words-filter" onClick={this.allWordsClicked}>All Words</div>
            </div>
            <hr/>
          </div>
        }
        {
          definitions
            .filter((entry: IWordDefinition) => {
              if (nonEmptyHash(learnerDefinitions) && filter === Filter.WithUserDefinitionOnly) {
                // Apply this filter only if result is going to include anything.
                return learnerDefinitions[entry.word] && learnerDefinitions[entry.word].length > 0;
              }
              // filter === Filter.AllWords
              return true;
            })
            .map((entry: IWordDefinition) =>
            <div key={entry.word} className={css.entry}>
              <div className={css.word}>{entry.word}</div>
              <div className={css.definition}>
                <Definition
                  definition={entry.definition}
                  userDefinitions={learnerDefinitions[entry.word]}
                  imageUrl={entry.image}
                  videoUrl={entry.video}
                  imageCaption={entry.imageCaption}
                  videoCaption={entry.videoCaption}
                />
              </div>
            </div>
          )
        }
      </div>
    );
  }

  private ownWordsClicked = () => {
    this.setState({ filter: Filter.WithUserDefinitionOnly });
  }

  private allWordsClicked = () => {
    this.setState({ filter: Filter.AllWords });
  }
}