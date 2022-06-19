module.exports = {
	extends: ["eslint:recommended", "standard"],
	env: {
		es6: true
	},
	parserOptions: {
		sourceType: "module"
	},
	rules: {
		"linebreak-style": ["error", "unix"],
		indent: ["error", "tab", {
			outerIIFEBody: 0,
			ImportDeclaration: 2,
			FunctionDeclaration: { parameters: 2 },
			FunctionExpression: { parameters: 2 },
			CallExpression: { arguments: 2 }
		}],
		"no-tabs": "off",
		"max-len": ["warn", 90, 4],
		quotes: ["error", "double", "avoid-escape"],
		semi: ["error", "always"],
		"no-var": ["error"],
		"prefer-const": "off",
		"no-console": ["error", { allow: ["warn", "error"] }],
		"space-before-function-paren": ["error", {
			anonymous: "never",
			named: "never",
			asyncArrow: "always"
		}],
		"object-curly-spacing": ["error", "always"],
		"keyword-spacing": ["error", {
			overrides: {
				if: { after: false },
				for: { after: false },
				while: { after: false },
				switch: { after: false },
				catch: { after: false }
			}
		}],
		"operator-linebreak": ["error", "after"],
		"dot-location": ["error", "object"],
		"arrow-parens": ["error", "as-needed"]
	}
};
