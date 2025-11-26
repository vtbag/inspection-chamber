import { type SparseDOMNode } from './sparse-dom';

export type Group = {
	parent?: Group;
	name: string;
	className: string;
	ancestor: boolean;
	children: Group[];
	scope?: HTMLElement;
	preOrder?: number;
	postOrder?: number;
	bfs?: number;
};

export function size(group: Group): number {
	return (group.postOrder! - group.preOrder! + 1) / 2;
}

export function nestGroups(
	node: SparseDOMNode,
	parent: Group,
	container: Group,
	groups: Map<string, Group>
) {
	if (node.viewTransitionName === 'none') {
		node.children.forEach((child) => nestGroups(child, parent, container, groups));
	} else {
		let group = groups.get(node.viewTransitionName);
		if (!group) {
			group = {
				children: [],
				name: node.viewTransitionName,
				className: node.viewTransitionClass!,
				ancestor: true,
			};
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
					return;
				}
				const root = groups.get('@')!;
				root.children.push(group); // fallback and viewTransitionGroup = "none"
				group.parent = root;
			}
		}
		node.children.forEach((child) =>
			nestGroups(child, group, node.viewTransitionGroup !== 'normal' ? group : container, groups)
		);
		group.ancestor = false;
	}
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
	console.log(`${' '.repeat(depth * 2)}- ${group.name} (${group.preOrder}, ${group.postOrder})`);
	group.children.forEach((child) => print(child, depth + 1));
}

function linear(group: Group, arr: Group[] = []): Group[] {
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
