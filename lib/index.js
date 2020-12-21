/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/no-extraneous-dependencies
const parser = require('posthtml-parser');
const { jsmin } = require('jsmin');
const render = require('miniprogram-posthtml-render');
const Api = require('./tree');

const JS_EXPRESSION_REG = /\{\{([\s\S]+?)\}\}/gm;

function minifyJSExpression(str) {
  return str.replace(JS_EXPRESSION_REG, (match, expression) => {
    // fix: jsmin bug
    // 除以数字的表达式数字丢失
    // a / 4 -> a/
    if (/\/\s*(\d+\.)?\d+$/.test(expression)) {
      return match;
    }

    // `{{ {a:1} }}`语法不处理
    if (/^\s\{/.test(expression)) {
      return match;
    }

    // why not uglify-js/terser
    // 目前发现uglify-js压缩过的代码有两处sbwx不支持
    // 1. 1000 -> 1e3 指数表示法
    // 2. undefined -> void 0
    // 这两点uglify-js没选项禁用
    // const result = UglifyJS.minify(expression, {
    //   compress: {
    //     expression: true,
    //   },
    //   output: {
    //     quote_style: 3,
    //   },
    // });
    // if (result.error) {
    //   console.log('\n[gulp-wxml-minify] UglifyJS压缩js表达式错误：');
    //   console.log('at', expression);
    //   console.log('at', node);
    //   console.log('at', file.path);
    //   throw result.error;
    // }
    // result.code = result.code.replace(/;$/, '');

    // return `{{${result.code}}}`;

    // jsmin简单的移除不必要的空格
    const minified = jsmin(expression);

    return `{{${minified}}}`;
  });
}

const BLANK_REG = /^[\n\s]+$/;

/**
 * 去除node首尾空白符
 * @param {*} node
 * https://astexplorer.net/#/gist/1f912bc3a2cf434bdbfa0678ead51a10/763f88d1b56855478aaa8f2fab8926676ce010bb
 *
 * 空白符只有首尾可以确定能删除, 中间部分不确定。example:
 * ```html
 * <view>
 *   <view>hello</view>
 *   world
 * </view>
 * ```
 * 只能变成
 * ```html
 * <view><view>hello</view>
 * world</view>
 * ```
 * `world`前的`\n`会变现为为一个空格
 */
function trimNode(node) {
  if (node.content) {
    const { length } = node.content;
    if (BLANK_REG.test(node.content[0])) {
      node.content[0] = '';
    }
    if (BLANK_REG.test(node.content[length - 1])) {
      node.content[length - 1] = '';
    }
    if (typeof node.content[0] === 'string') {
      node.content[0] = node.content[0].trimLeft();
    }
    if (typeof node.content[length - 1] === 'string') {
      node.content[length - 1] = node.content[length - 1].trimRight();
    }
  }
}

/**
 * wxml压缩
 * 1. 去除标签内首尾空白符
 * 2. 去除注释
 * 3. js表达式压缩
 * 4. 去除属性间空格
 */
module.exports = wxml => {
  let str = wxml.trim();
  // 2.
  str = str.replace(/\n?<!--[\s\S]*?-->\n?/gm, '');

  // 3.
  const tree = parser(str, { recognizeSelfClosing: true });
  Api.call(tree);
  tree.walk(node => {
    if (typeof node === 'object') {
      // 1.
      trimNode(node);
      // `template` `data`属性有特殊语法UglifyJS不认识
      // 1. 使用`...`解构
      // 2. `data="{{a:1, b:2}}"`或`data="{{a, b}}"`
      if (node.tag === 'template') {
        return node;
      }

      if (node.attrs) {
        Object.keys(node.attrs).forEach(key => {
          // `wx:scope-data` 使用`...`解构, UglifyJS不认识
          if (key === 'wx:scope-data') {
            return;
          }

          const value = node.attrs[key];
          node.attrs[key] = minifyJSExpression(value);
        });
      }

      return node;
    }

    if (/^[\n\s]+$/.test(node)) {
      return '\n';
    }

    /**
     * ```html
     * <view>
     *   <view>hello</view>
     *   world
     * </view>
     * ```
     * ->
     * ```html
     * <view><view>hello</view>
     * world</view>
     * ```
     * 去除`world`前空格
     */
    node = node.replace(/^[\n\s]+/, '\n');

    return minifyJSExpression(node);
  });
  // 4.
  str = render(tree, { closingSingleTag: 'slash', removeSpaceBetweenAttributes: true });

  return str;
};
