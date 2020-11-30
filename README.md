# wxml-minify

压缩[wxml](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml)，减小程序包大小。微信开发者工具只压缩了`js`, `json`, `css`, 实际`wxml`也可以进行压缩来减小包大小。

## 使用

```
$ yarn add wxml-minify -D
```

```javascript
const minify = require('wxml-minify');

minify(`
<view class="{{a ? 'b' : 'c'}}">
  <!-- comment -->
  <view wx:if="{{a && b}}">hello</view>
  <view wx:else">world</view>
  <image class="d" id="e" lazy-load />
</view>
`)
// <view class="{{a?'b':'c'}}"><view wx:if="{{a&&b}}">hello</view><view wx:else">world</view><image class="d"id="e" lazy-load/></view>
```

## 原理

目前通过以下途径压缩，压缩率20%以上：
1. 去除标签间换行符
2. 去除注释
3. js表达式压缩
4. 去除属性间空格
5. 内容为空的标签使用`/>`结尾
6. 属性值为`true`的使用简写形式 `<image lazy-load/>`

5和6可以使用prettier插件[prettier-plugin-auto-close-empty-tag](https://github.com/littleprincewdk/prettier-plugin-auto-close-empty-tag)和[prettier-plugin-format-true-value-attribute)](https://github.com/littleprincewdk/prettier-plugin-format-true-value-attribute)进行规范

