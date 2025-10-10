export type Group = {
	name: string;
	className: string;
	ancestor: boolean;
	children: Group[];
	scope?: HTMLElement;
	size?: number;
};

export function size(group: Group): number {
	return (group.size ??= group.children.reduce((acc, node) => acc + 1 + size(node), 0));
}
