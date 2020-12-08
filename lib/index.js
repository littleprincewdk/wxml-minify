const { pd } = require('pretty-data');
// eslint-disable-next-line import/no-extraneous-dependencies
const parser = require('posthtml-parser');
const Api = require('posthtml/lib/api');
const { jsmin } = require('jsmin');
const render = require('miniprogram-posthtml-render');

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

/**
 * wxml压缩
 * 1. 去除标签间换行符
 * 2. 去除注释
 * 3. js表达式压缩
 * 4. 去除属性间空格
 */
module.exports = wxml => {
  let str = wxml;
  // 1.
  // 2.
  str = pd.xmlmin(str);

  // 3.
  const tree = parser(str, { recognizeSelfClosing: true });
  Api.call(tree);
  tree.walk(node => {
    if (typeof node === 'object') {
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
          // eslint-disable-next-line no-param-reassign
          node.attrs[key] = minifyJSExpression(value);
        });
      }

      return node;
    }

    return minifyJSExpression(node.trim());
  });
  // 4.
  str = render(tree, { closingSingleTag: 'slash', removeSpaceBetweenAttributes: true });

  return str;
};
