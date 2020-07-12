
#include <nan.h>
#include <stdio.h>
#include <stdlib.h>

#include "my_object.hpp"
#include "gl_proxy_manager.hpp"
// #include "my_extension.hpp"

using namespace Nan;
using namespace v8;

NAN_METHOD(hello)
{
    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
    auto buffer = node::Buffer::Data(info[0]->ToObject(context).ToLocalChecked());
    // char* buffer = (char*) node::Buffer::Data(info[0]->ToObject(context));
    size_t size = node::Buffer::Length(info[0]);
    // size_t size = Buffer::Length(bufferObj);
    for (size_t i = 0; i < size; ++i) {
        // buffer[i] = i;
        buffer[i] = rand() % 0xFF;
    }
    printf("===============\n");
    printf(" hello called %p %d\n", buffer, size);
    printf("===============\n");
    info.GetReturnValue().Set(Nan::New("hello, world").ToLocalChecked());
}

NAN_MODULE_INIT(init)
{
    // NAN_EXPORT(target, hello);
    Nan::Set(target, New<String>("hello").ToLocalChecked(),
             GetFunction(New<FunctionTemplate>(hello)).ToLocalChecked());

    demo::MyObject::Init(target);
    demo::GLProxyManager::Init(target);
}

// NODE_MODULE(NODE_GYP_MODULE_NAME, init);
NAN_MODULE_WORKER_ENABLED(my_extension, init);
