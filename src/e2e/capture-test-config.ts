export type GroupPresence = 'both' | 'old-only' | 'new-only';

export type GroupIdentityExpectation = {
	attributeName: string;
	oldValue: string;
	newValue: string;
	expectSameElement: boolean;
};

export type GroupExpectation = {
	name: string;
	presence: GroupPresence;
	identity?: GroupIdentityExpectation;
	pseudoElement?: string;
};

export type CaptureTestConfig = {
	targetTag: string;
	groups: GroupExpectation[];
};

class GroupBuilder {
	constructor(
		private readonly parent: CaptureTestConfigBuilder,
		private readonly group: GroupExpectation
	) {}

	oldOnly(): this {
		this.group.presence = 'old-only';
		return this;
	}

	newOnly(): this {
		this.group.presence = 'new-only';
		return this;
	}

	both(): this {
		this.group.presence = 'both';
		return this;
	}

	identitySame(attributeName: string, value: string): this {
		this.group.identity = {
			attributeName,
			oldValue: value,
			newValue: value,
			expectSameElement: true,
		};
		return this;
	}

	identityDifferent(attributeName: string, oldValue: string, newValue: string): this {
		this.group.identity = {
			attributeName,
			oldValue,
			newValue,
			expectSameElement: false,
		};
		return this;
	}

	pseudoElement(value: string): this {
		this.group.pseudoElement = value;
		return this;
	}

	done(): CaptureTestConfigBuilder {
		return this.parent;
	}
}

export class CaptureTestConfigBuilder {
	private targetTagValue = 'html';
	private readonly groups = new Map<string, GroupExpectation>();

	targetTag(tagName: string): this {
		this.targetTagValue = tagName;
		return this;
	}

	group(name: string): GroupBuilder {
		const existing = this.groups.get(name);
		if (existing) {
			return new GroupBuilder(this, existing);
		}

		const created: GroupExpectation = { name, presence: 'both' };
		this.groups.set(name, created);
		return new GroupBuilder(this, created);
	}

	build(): CaptureTestConfig {
		return {
			targetTag: this.targetTagValue,
			groups: [...this.groups.values()],
		};
	}
}

export function captureTestConfig(): CaptureTestConfigBuilder {
	return new CaptureTestConfigBuilder();
}
