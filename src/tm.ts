import { threadCpuUsage } from "process";

export function treeMap(container: HTMLElement, tree: Tree) {
  const total = tree.clearWeight().weight();
  

}


class Tree {
  name: string;
  children: Tree[];
  weightValue?: number;
  constructor(name: string) {
    this.name = name;
    this.children = [];
  }
  addChild(child: Tree) {
    this.children.push(child);
    return this;
  }
  weight(): number {
    this.weightValue ??= this.children.reduce((sum, child) => sum + child.weight(), 1);
    return this.weightValue;
  }
  clearWeight() {
    this.weightValue = undefined;
    this.children.forEach(child => child.clearWeight());
    return this;
  }
}

function nextLabelGenerator() {
  let index = 0;
  return function getNextLabel() {
    let label = "";
    let n = index;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    index++;
    return label;
  };
}

const getNextLabel = nextLabelGenerator();

treeMap(document.querySelector("main")!,
  new Tree(getNextLabel())
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel())
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel())
        .addChild(new Tree(getNextLabel()))
        .addChild(new Tree(getNextLabel()))
      )
      .addChild(new Tree(getNextLabel()))
    )
    .addChild(new Tree(getNextLabel()))
    .addChild(new Tree(getNextLabel())
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel())
        .addChild(new Tree(getNextLabel()))
        .addChild(new Tree(getNextLabel()))
      )
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
      .addChild(new Tree(getNextLabel()))
    )
);