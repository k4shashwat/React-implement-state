import React from "react";

export default class ClassA extends React.Component {
  constructor(props) {
    super(props);
    //  this.onClick = this.onClick.bind(this);
  }
  onClick(e) {
    // do something
    console.log("A was clicked");
  }
  render() {
    return (
      <div>
        <button onClick={this.onClick()}>button </button>
        <button
          onClick={() => {
            console.log("B was clicked");
          }}
        >
          Button 2
        </button>
      </div>
    );
  }
}
