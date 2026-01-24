import { deriveCSSSelector } from './element-selector';
import { type SparseDOMNode } from './sparse-dom';

export type Group = {
	parent?: Group;
	name: string;
	className: string;
	ancestor: boolean;
	children: Group[];
	old?: SparseDOMNode;
	new?: SparseDOMNode;
	oldDuplicates?: SparseDOMNode[];
	newDuplicates?: SparseDOMNode[];
	preOrder?: number;
	postOrder?: number;
	bfs?: number;
};

export function gid(group?: Group): number {
	return ~~(((group?.preOrder ?? 0) + 1) / 2);
}

export function size(group?: Group): number {
	return ~~(((group?.postOrder ?? 0) - (group?.preOrder ?? 0) + 1) / 2);
}

export function color(group: Group): string {
	let root = group;
	while (root.parent) root = root.parent;
	return `oklch(0.7 0.07 ${(360 / size(root)) * gid(group)}deg / 1)`;
}

export function nestGroups(
	node: SparseDOMNode,
	parent: Group,
	container: Group,
	groups: Map<string, Group>,
	oldOrNew: 'old' | 'new'
): boolean {
	let hasDuplicates = false;
	if (node.viewTransitionName === 'none') {
		node.children.forEach(
			(child) =>
				(hasDuplicates = nestGroups(child, parent, container, groups, oldOrNew) || hasDuplicates)
		);
	} else {
		let group = groups.get(node.viewTransitionName);
		if (group) {
			if (group[oldOrNew] === undefined) {
				group[oldOrNew] = node;
			} else {
				group[`${oldOrNew}Duplicates`] ||= [];
				group[`${oldOrNew}Duplicates`]!.push(node);
				hasDuplicates = true;
			}
		} else {
			group = {
				children: [],
				name: node.viewTransitionName,
				className: node.viewTransitionClass!,
				ancestor: true,
			};
			group[oldOrNew] = node;

			groups.set(node.viewTransitionName, group);
			if (node.viewTransitionGroup === 'nearest') {
				parent.children.push(group);
				group.parent = parent;
			} else if (node.viewTransitionGroup === 'normal' || node.viewTransitionGroup === 'contain') {
				container.children.push(group);
				group.parent = container;
			} else {
				const namedGroup = groups.get(node.viewTransitionGroup!);
				if (namedGroup?.ancestor) {
					namedGroup.children.push(group);
					group.parent = namedGroup;
				} else {
					const root = groups.get('@')!;
					root.children.push(group); // fallback and viewTransitionGroup = "none"
					group.parent = root;
				}
			}
		}
		node.children.forEach(
			(child) =>
				(hasDuplicates = nestGroups(
					child,
					group,
					node.viewTransitionGroup !== 'normal' ? group : container,
					groups,
					oldOrNew
				)) || hasDuplicates
		);
		group.ancestor = false;
	}
	return hasDuplicates;
}

export function numberGroupsDFS(group: Group, counter = { value: 1 }) {
	group.preOrder = counter.value++;
	group.children.forEach((child) => numberGroupsDFS(child, counter));
	group.postOrder = counter.value++;
}
export function numberGroupsBFS(root: Group) {
	const queue: Group[] = [root];
	let counter = 0;
	while (queue.length > 0) {
		const group = queue.shift()!;
		group.bfs = counter++;
		group.children.forEach((child) => queue.push(child));
	}
}

export function print(group: Group, depth = 0) {
	console.log(`${' '.repeat(depth * 2)}- ${group.name}`);
	group.children.forEach((child) => print(child, depth + 1));
}

export function linear(group: Group, arr: Group[] = []): Group[] {
	arr.push(group);
	group.children.forEach((child) => linear(child, arr));
	return arr;
}

export function isSorted(group: Group): boolean {
	return linear(group).every(
		(g, idx, arr) =>
			idx === 0 ||
			arr[idx - 1].name.replace(/^-vtbag-/, '').localeCompare(g.name.replace(/^-vtbag-/, '')) <= 0
	);
}

/* ---------------------------------------------------------------- */

export function relocate(group: Group, document: Document) {
	group.children.forEach((child) => relocate(child, document));
	if (group.old && group.old.element.ownerDocument !== document)
		group.old.element = document.querySelector(deriveCSSSelector(group.old.element))!;
	if (group.new && group.new.element.ownerDocument !== document)
		group.new.element = document.querySelector(deriveCSSSelector(group.new.element))!;
}
/* ---------------------------------------------------------------- */

export type SerializedGroupNode = {
	name: string;
	className: string;
	ancestor: boolean;
	children: number[];
	preOrder?: number;
	postOrder?: number;
	bfs?: number;
	oldViewTransitionGroup?: string;
	oldViewTransitionClass?: string;
	oldPseudoElement?: string;
};

export function serializeGroupGraph(root: Group): SerializedGroupNode[] {
	const nodes: SerializedGroupNode[] = [];
	const flattened = linear(root);
	flattened.forEach((group) => {
		const node: SerializedGroupNode = {
			name: group.name,
			className: group.className,
			ancestor: group.ancestor,
			children: group.children.map((child) => child.preOrder!),
			preOrder: group.preOrder,
			postOrder: group.postOrder,
			bfs: group.bfs,
			oldViewTransitionGroup: group.old!.viewTransitionGroup,
			oldViewTransitionClass: group.old!.viewTransitionClass,
			oldPseudoElement: group.old!.pseudoElement,
		};
		nodes.push(node);
	});
	return nodes;
}

export function deserializeGroupGraph(nodes: SerializedGroupNode[]): Group {
	const groupMap = new Map<number, Group>();
	nodes.forEach((node) => {
		groupMap.set(node.preOrder!, {
			name: node.name,
			className: node.className,
			ancestor: node.ancestor,
			children: [],
			preOrder: node.preOrder!,
			postOrder: node.postOrder,
			bfs: node.bfs,
			old: deserializeSparseDOMNode(node),
		});
	});

	nodes.forEach((node) => {
		const id = node.preOrder!;
		const group = groupMap.get(id)!;
		group.children = node.children.map((childId) => {
			const child = groupMap.get(childId)!;
			child.parent = group;
			return child;
		});
	});
	return groupMap.get(1)!;
}

function deserializeSparseDOMNode(node?: SerializedGroupNode): SparseDOMNode | undefined {
	if (!node) return undefined;
	return {
		viewTransitionName: 'serialized',
		viewTransitionGroup: node.oldViewTransitionGroup,
		viewTransitionClass: node.oldViewTransitionClass,
		pseudoElement: node.oldPseudoElement,
		style: {} as CSSStyleDeclaration,
		element: document.createElement('div'),
		children: [],
	};
}
